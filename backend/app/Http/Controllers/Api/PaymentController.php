<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\KhqrConfigurationException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Notifications\OrderPaidNotification;
use App\Services\BakongService;
use App\Services\PayoutCalculationService;
use App\Support\OrderStatuses;
use App\Support\PaymentStatuses;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

class PaymentController extends Controller
{
    /**
     * Matches both the canonical lowercase statuses and any legacy
     * capitalized values written before status normalization existed.
     */
    private function paidStatuses(): array
    {
        return array_merge(OrderStatuses::SETTLED, array_map('ucfirst', OrderStatuses::SETTLED));
    }

    /**
     * Platform finance overview. Every figure here is derived from the
     * financial breakdown stored on each order at creation time (see
     * OrderFinanceCalculator) rather than a flat guess at read time, so the
     * "admin wallet" always reflects real platform PROFIT, never gross
     * customer sales.
     *
     * Supports date filtering: today, this week, this month, or custom range.
     * Only includes valid COMPLETED/DELIVERED orders in financial totals.
     */
    public function getStatsAndTransactions(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
        // Apply date filtering
        $query = Order::with(['user:id,name', 'restaurant:id,name', 'delivery.rider.user:id,name']);
        
        // Only include settled orders (DELIVERED or COMPLETED)
        $query->whereIn('status', $this->paidStatuses());
        
        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->where('created_at', '<=', $endDate . ' 23:59:59');
        }
        
        $paidOrders = $query->latest()->get();
        
        $totalVolume = (float) $paidOrders->sum('total_price');
        $restaurantPayouts = (float) $paidOrders->sum('restaurant_amount');
        $riderPayouts = (float) $paidOrders->sum('rider_amount');
        $platformProfit = (float) $paidOrders->sum('platform_profit');
        
        // Build detailed transaction records with order information
        $transactions = $paidOrders
            ->filter(function (Order $order) {
                // Only include orders that have either a restaurant payout or rider payout
                return ($order->restaurant_amount > 0) || ($order->rider_amount > 0);
            })
            ->map(function (Order $order) {
                $orderTotal = (float) ($order->total_price ?? 0);
                $restaurantAmount = (float) ($order->restaurant_amount ?? 0);
                $riderAmount = (float) ($order->rider_amount ?? 0);
                $platformAmount = (float) ($order->platform_profit ?? 0);
                
                // Determine payment/order status
                $paymentStatus = 'Pending';
                if ($order->status === OrderStatuses::COMPLETED) {
                    $paymentStatus = 'Completed';
                }
                
                return [
                    'id' => 'TXN-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                    'order_number' => 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                    'dateTime' => $order->created_at ? $order->created_at->format('M d, Y H:i') : 'N/A',
                    'restaurant' => $order->restaurant->name ?? 'Restaurant',
                    'rider' => $order->delivery?->rider?->user?->name ?? '-',
                    'order_total' => $orderTotal,
                    'restaurant_amount' => $restaurantAmount,
                    'rider_amount' => $riderAmount,
                    'platform_amount' => $platformAmount,
                    'status' => $paymentStatus,
                    'category' => $restaurantAmount > 0 ? 'restaurant' : 'driver',
                ];
            })
            ->sortByDesc('dateTime')
            ->take(50)
            ->values();
        
        // Calculate completed orders count (only settled orders)
        $completedOrders = $paidOrders->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    // Gross sales customers paid in total - NOT platform profit.
                    'total_volume' => $totalVolume,
                    'restaurant_payouts' => round($restaurantPayouts, 2),
                    'rider_payouts' => round($riderPayouts, 2),
                    // What the platform actually keeps, and what the admin
                    // wallet balance is - restaurant/rider shares already
                    // subtracted.
                    'platform_revenue' => round($platformProfit, 2),
                    'admin_wallet_balance' => round($platformProfit, 2),
                    'pending_payouts' => round($restaurantPayouts + $riderPayouts, 2),
                    'successful_payouts' => 0,
                    'completed_orders' => $completedOrders,
                ],
                'transactions' => $transactions,
            ],
        ]);
    }

    public function processPayout(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Payout processing needs a payouts table before real transfers can be recorded.',
        ], 501);
    }

    public function calculatePayout(Request $request, PayoutCalculationService $calculator): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => ['required', 'string', 'in:rider,merchant'],
            'entity_name' => ['nullable', 'string', 'max:255'],
            'entity_id' => ['nullable', 'string', 'max:100'],
            'period' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'size:3'],
            'base_rate' => ['required_if:entity_type,rider', 'numeric', 'min:0'],
            'distance_rate' => ['required_if:entity_type,rider', 'numeric', 'min:0'],
            'quest_completed' => ['boolean'],
            'quest_bonus' => ['required_if:quest_completed,true', 'numeric', 'min:0'],
            'orders' => ['required_if:entity_type,rider', 'array'],
            'orders.*.reference' => ['nullable', 'string', 'max:100'],
            'orders.*.distance_km' => ['required_if:entity_type,rider', 'numeric', 'min:0'],
            'orders.*.peak_surge_bonus' => ['nullable', 'numeric', 'min:0'],
            'orders.*.customer_tip' => ['nullable', 'numeric', 'min:0'],
            'orders.*.status' => ['nullable', 'string', 'max:50'],
            'orders.*.picked_up' => ['boolean'],
            'orders.*.rider_at_fault' => ['boolean'],
            'gross_sales' => ['required_if:entity_type,merchant', 'numeric', 'min:0'],
            'commission_rate_percentage' => ['required_if:entity_type,merchant', 'numeric', 'min:0'],
            'platform_discounts' => ['required_if:entity_type,merchant', 'numeric', 'min:0'],
            'merchant_discounts' => ['required_if:entity_type,merchant', 'numeric', 'min:0'],
            'payment_processing_fee_percentage' => ['required_if:entity_type,merchant', 'numeric', 'min:0'],
            'tax_rate' => ['required_if:entity_type,merchant', 'numeric', 'min:0'],
            'tax_mode' => ['nullable', 'string', 'in:excluded,net_of_tax'],
        ]);

        try {
            $result = $validated['entity_type'] === 'rider'
                ? $calculator->calculateRider($validated)
                : $calculator->calculateMerchant($validated);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    /**
     * Customer-facing: create (or reuse an already-active) KHQR payment for
     * one of the customer's own orders. The amount is always the order's
     * own stored total - a value React sends is never trusted.
     */
    public function createKhqrPayment(Request $request, BakongService $bakong): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
        ]);

        $order = Order::findOrFail($validated['order_id']);
        $this->authorizeOrderOwner($request, $order);

        if ($order->payment_status === PaymentStatuses::PAID) {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid.',
            ], 409);
        }

        $existing = Payment::where('order_id', $order->id)
            ->where('provider', 'bakong')
            ->where('status', PaymentStatuses::PENDING)
            ->latest()
            ->first();

        if ($existing && $existing->isExpired()) {
            $existing->update(['status' => PaymentStatuses::EXPIRED]);
            $existing = null;
        }

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'An active KHQR payment already exists for this order.',
                'data' => $this->formatPayment($existing, $order),
            ]);
        }

        if (! $bakong->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'KHQR payment is not available right now. Please choose another payment method.',
            ], 500);
        }

        $amount = (float) ($order->total_price ?? $order->total);
        $currency = strtoupper((string) config('khqr.currency', 'USD'));

        try {
            $gatewayPayment = $bakong->createPayment($order);
        } catch (KhqrConfigurationException $exception) {
            Log::error('Failed to create a Bakong KHQR payment for an order.', [
                'order_id' => $order->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to start a KHQR payment right now. Please try again shortly.',
            ], 500);
        }

        try {
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method' => 'khqr',
                'provider' => 'bakong',
                'provider_transaction_id' => $gatewayPayment['provider_transaction_id'],
                'amount' => $amount,
                'currency' => $currency,
                'status' => PaymentStatuses::PENDING,
                'qr_string' => $gatewayPayment['qr_string'] ?? null,
                'qr_image' => $gatewayPayment['qr_image'] ?? null,
                'md5' => $gatewayPayment['md5'],
                'gateway_response' => $gatewayPayment['gateway_response'] ?? null,
                'expires_at' => $gatewayPayment['expires_at'],
            ]);
        } catch (QueryException $exception) {
            // The unique index on md5 tripped - the KHQR SDK builds MD5 from
            // the full payload (account/amount/bill number/expiry), so a
            // collision here would mean a real hash clash rather than a
            // normal race. Ask the customer to retry rather than silently
            // reusing another payment's QR code.
            Log::warning('Bakong KHQR generation returned an MD5 that collided with an existing payment.', [
                'order_id' => $order->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Could not generate a unique KHQR code right now. Please try again.',
            ], 409);
        }

        $order->update([
            'payment_method' => 'khqr',
            'payment_status' => PaymentStatuses::PENDING,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'KHQR payment created successfully.',
            'data' => $this->formatPayment($payment, $order),
        ], 201);
    }

    /**
     * Customer-facing: fetch a payment and, while it's still pending,
     * verify it against KHQR.LINK. This is the ONLY path that can mark a
     * payment (and its order) PAID - the frontend polls this endpoint and
     * is never trusted to report success itself.
     */
    public function showPayment(Request $request, Payment $payment, BakongService $bakong): JsonResponse
    {
        $order = $payment->order;
        $this->authorizeOrderOwner($request, $order);

        if (PaymentStatuses::isTerminal($payment->status)) {
            return response()->json([
                'success' => true,
                'message' => 'Payment retrieved successfully.',
                'data' => $this->formatPayment($payment, $order),
            ]);
        }

        if ($payment->isExpired()) {
            $payment->update(['status' => PaymentStatuses::EXPIRED]);
            $order->update(['payment_status' => PaymentStatuses::EXPIRED]);

            return response()->json([
                'success' => true,
                'message' => 'This KHQR code has expired.',
                'data' => $this->formatPayment($payment->fresh(), $order->fresh()),
            ]);
        }

        $notice = $this->verifyKhqrPayment($payment, $bakong);

        $data = $this->formatPayment($payment->fresh(), $order->fresh());

        if ($notice) {
            // Ephemeral - reflects only this one check, never persisted to
            // the payment row, since the underlying status is genuinely
            // still unknown (not a real "failure") when this is set.
            $data['verification_notice'] = $notice;
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment status retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * Returns a human-readable notice when the provider's response for this
     * one check couldn't be classified as paid/pending/failed (e.g. Bakong's
     * own daily request quota was exhausted) - null otherwise. The payment
     * itself is never marked FAILED for this, since the real transaction
     * status is still genuinely unknown, not negative.
     */
    private function verifyKhqrPayment(Payment $payment, BakongService $bakong): ?string
    {
        if (PaymentStatuses::isTerminal($payment->status)) {
            return null;
        }

        if (! $payment->md5) {
            return null;
        }

        $verification = $bakong->checkPayment($payment->md5);

        if ($verification['result'] === 'success') {
            $markedPaid = $this->markKhqrPaidIfValid($payment, $payment->order, $verification, $bakong);
            if ($markedPaid) {
                // Payment confirmed -> the order is now PENDING_RESTAURANT
                // (that is the status it was created in; nothing here moves it
                // forward). Rider matching deliberately does NOT run at this
                // point: a rider may only be assigned after the restaurant has
                // accepted, prepared and marked the order READY_FOR_PICKUP -
                // see OrderController::updateStatus().
                $this->notifyRestaurantOfPaidOrder($payment->order->fresh());
            }

            return null;
        }

        if ($verification['result'] === 'failed') {
            $payment->update([
                'status' => PaymentStatuses::FAILED,
                'failed_reason' => 'Bakong reported this transaction as failed.',
            ]);
            $payment->order->update(['payment_status' => PaymentStatuses::FAILED]);

            return null;
        }

        // 'pending' or 'not_found': no state change yet - the customer
        // simply hasn't paid. Nothing to tell them.
        if ($verification['result'] === 'not_found' || $verification['result'] === 'pending') {
            return null;
        }

        // 'error': the provider itself couldn't be checked this time (down,
        // unreachable, or - as originally diagnosed here - its daily quota
        // was exhausted). The frontend keeps polling; expiry is what
        // eventually stops it. Surface whatever Bakong told us so the
        // customer isn't left staring at a silent spinner.
        return $verification['message'] ?? 'Payment verification is temporarily unavailable. Please wait a moment and keep this page open.';
    }

    /**
     * @param  array{result: string, hash?: string|null, from_account_id?: string|null, to_account_id?: string|null, currency?: string|null, amount?: float|null, raw?: array<string, mixed>}  $verification
     */
    private function markKhqrPaidIfValid(Payment $payment, Order $order, array $verification, BakongService $bakong): bool
    {
        $amountMatches = isset($verification['amount'])
            && abs((float) $verification['amount'] - (float) $payment->amount) < 0.01;
        $currencyMatches = strtoupper((string) ($verification['currency'] ?? '')) === strtoupper($payment->currency);
        $expectedAccount = $bakong->expectedAccountId();
        $accountMatches = ! $expectedAccount
            || strcasecmp((string) ($verification['to_account_id'] ?? ''), (string) $expectedAccount) === 0;

        if (! $amountMatches || ! $currencyMatches || ! $accountMatches) {
            Log::warning('Bakong transaction verified but its details do not match the expected payment.', [
                'payment_id' => $payment->id,
                'expected_amount' => (float) $payment->amount,
                'expected_currency' => $payment->currency,
            ]);

            $payment->update([
                'status' => PaymentStatuses::FAILED,
                'failed_reason' => 'The paid transaction did not match the expected order amount, currency, or account.',
            ]);
            $order->update(['payment_status' => PaymentStatuses::FAILED]);

            return false;
        }

        return DB::transaction(function () use ($payment, $order, $verification): bool {
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $locked || $locked->status !== PaymentStatuses::PENDING) {
                // Already resolved by a concurrent status check - idempotent no-op.
                return false;
            }

            $hash = $verification['hash'] ?? null;

            $alreadyUsedElsewhere = $hash
                && Payment::where('bakong_transaction_hash', $hash)
                    ->where('id', '!=', $locked->id)
                    ->exists();

            if ($alreadyUsedElsewhere) {
                $locked->update([
                    'status' => PaymentStatuses::FAILED,
                    'failed_reason' => 'This Bakong transaction has already been applied to another payment.',
                ]);

                return false;
            }

            try {
                $locked->update([
                    'status' => PaymentStatuses::PAID,
                    'paid_at' => now(),
                    'bakong_transaction_hash' => $hash,
                    'gateway_response' => $verification['raw'] ?? $locked->gateway_response,
                ]);
            } catch (QueryException $exception) {
                // The unique index on bakong_transaction_hash tripped: a
                // concurrent request claimed this exact Bakong transaction
                // for a different payment row between our exists() check
                // above and this write. Treat as a duplicate, not a crash.
                $locked->update([
                    'status' => PaymentStatuses::FAILED,
                    'failed_reason' => 'This Bakong transaction has already been applied to another payment.',
                ]);

                return false;
            }

            $order->update(['payment_status' => PaymentStatuses::PAID]);

            return true;
        });
    }

    /**
     * Fires once, right after a payment's PAID transition is confirmed.
     *
     * Only the restaurant owner is notified here (for delivery AND pickup
     * orders): the order is PENDING_RESTAURANT and waits for them to accept.
     * The rider is notified later - by RiderMatchingService, and only if/when
     * the restaurant marks the order READY_FOR_PICKUP and a rider is actually
     * assigned to it.
     *
     * Queued (ShouldQueue) so a slow/unavailable mail server never delays the
     * customer's payment-confirmation response, and wrapped defensively so a
     * notification failure can never be mistaken for - or interfere with -
     * the payment itself already being safely marked PAID.
     */
    private function notifyRestaurantOfPaidOrder(Order $order): void
    {
        $order->loadMissing(['restaurant.user']);

        if ($order->restaurant?->user) {
            try {
                $order->restaurant->user->notify(new OrderPaidNotification($order));
            } catch (Throwable $exception) {
                Log::warning('Failed to notify the restaurant owner of a paid order.', [
                    'order_id' => $order->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function formatPayment(Payment $payment, ?Order $order = null): array
    {
        $order ??= $payment->order;

        return [
            'id' => $payment->id,
            'order_id' => $payment->order_id,
            'order_status' => $order?->status,
            'status' => $payment->status,
            'payment_method' => $payment->payment_method,
            'provider' => $payment->provider,
            'provider_transaction_id' => $payment->provider_transaction_id,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'qr_string' => $payment->qr_string,
            'qr_image' => $payment->qr_image,
            'expires_at' => $payment->expires_at?->toIso8601String(),
            'paid_at' => $payment->paid_at?->toIso8601String(),
            'failed_reason' => $payment->failed_reason,
        ];
    }

    private function authorizeOrderOwner(Request $request, Order $order): void
    {
        $user = $request->user();
        $role = strtolower((string) $user?->role);
        $isAdmin = in_array($role, ['admin', 'super_admin', 'super admin'], true);

        if (! $user || (! $isAdmin && $order->user_id !== $user->id)) {
            abort(403, 'You do not have permission to access this payment.');
        }
    }
}
