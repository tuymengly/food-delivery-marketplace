<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BakongConfigurationException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\BakongService;
use App\Services\PayoutCalculationService;
use App\Services\PayWayService;
use App\Services\RiderMatchingService;
use App\Support\OrderStatuses;
use App\Support\PaymentStatuses;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

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
     */
    public function getStatsAndTransactions(Request $request): JsonResponse
    {
        $paidOrders = Order::with(['user:id,name', 'restaurant:id,name', 'delivery.rider.user:id,name'])
            ->whereIn('status', $this->paidStatuses())
            ->latest()
            ->get();

        $totalVolume = (float) $paidOrders->sum('total_price');
        $restaurantPayouts = (float) $paidOrders->sum('restaurant_amount');
        $riderPayouts = (float) $paidOrders->sum('rider_amount');
        $platformProfit = (float) $paidOrders->sum('platform_profit');

        $restaurantTransactions = $paidOrders->map(function (Order $order) {
            return [
                'id' => 'TXN-R-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                'dateTime' => $order->created_at ? $order->created_at->format('M d, H:i') : 'N/A',
                'entity' => $order->restaurant->name ?? 'Restaurant',
                'type' => 'Restaurant Payout',
                'amount' => (float) ($order->restaurant_amount ?? 0),
                'status' => 'Pending',
                'category' => 'restaurant',
                'avatar' => null,
            ];
        });

        $riderTransactions = $paidOrders
            ->filter(fn (Order $order) => $order->delivery?->rider)
            ->map(function (Order $order) {
                return [
                    'id' => 'TXN-D-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                    'dateTime' => $order->created_at ? $order->created_at->format('M d, H:i') : 'N/A',
                    'entity' => $order->delivery->rider->user->name ?? 'Rider',
                    'type' => 'Driver Payout',
                    'amount' => (float) ($order->rider_amount ?? 0),
                    'status' => 'Pending',
                    'category' => 'driver',
                    'avatar' => null,
                ];
            });

        $transactions = $restaurantTransactions->merge($riderTransactions)
            ->sortByDesc('dateTime')
            ->take(20)
            ->values();

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
     * one of the customer's own orders. Generation itself is a pure/offline
     * KHQR string build - no Bakong API call happens here.
     */
    public function createKhqrPayment(Request $request, BakongService $bakong): JsonResponse
    {
        return $this->createPayWayPayment($request, app(PayWayService::class), 'khqr');
    }

    public function createPayWayPayment(Request $request, PayWayService $payWay, ?string $forcedMethod = null): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'payment_method' => ['nullable', 'string', 'in:khqr,card'],
        ]);
        $paymentMethod = $forcedMethod ?: ($validated['payment_method'] ?? 'khqr');

        $order = Order::findOrFail($validated['order_id']);
        $this->authorizeOrderOwner($request, $order);

        if ($order->payment_status === PaymentStatuses::PAID) {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid.',
            ], 409);
        }

        $existing = Payment::where('order_id', $order->id)
            ->where('provider', 'payway')
            ->where('payment_method', $paymentMethod)
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
                'message' => 'An active PayWay payment already exists for this order.',
                'data' => $this->formatPayment($existing, $order),
            ]);
        }

        if (! $payWay->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'ABA PayWay is not available right now. Please choose another payment method.',
            ], 500);
        }

        $amount = (float) ($order->total_price ?? $order->total);
        $currency = strtoupper((string) config('services.payway.currency', 'USD'));
        $transactionId = $this->payWayTransactionId($order, $paymentMethod);

        try {
            $gatewayPayment = $paymentMethod === 'card'
                ? $payWay->createCardPayment($order, $transactionId)
                : $payWay->createQrPayment($order, $transactionId);
        } catch (\App\Exceptions\PayWayConfigurationException $exception) {
            Log::error('Failed to create a PayWay payment for an order.', [
                'order_id' => $order->id,
                'payment_method' => $paymentMethod,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to start ABA PayWay payment right now. Please try again shortly.',
            ], 500);
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => $paymentMethod,
            'provider' => 'payway',
            'provider_transaction_id' => $gatewayPayment['provider_transaction_id'],
            'amount' => $amount,
            'currency' => $currency,
            'status' => PaymentStatuses::PENDING,
            'qr_string' => $gatewayPayment['qr_string'] ?? null,
            'qr_image' => $gatewayPayment['qr_image'] ?? null,
            'checkout_url' => $gatewayPayment['checkout_url'] ?? null,
            'checkout_html' => $gatewayPayment['checkout_html'] ?? null,
            'deeplink' => $gatewayPayment['deeplink'] ?? null,
            'gateway_response' => $gatewayPayment['gateway_response'] ?? null,
            'expires_at' => $gatewayPayment['expires_at'],
        ]);

        $order->update([
            'payment_method' => $paymentMethod,
            'payment_status' => PaymentStatuses::PENDING,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'PayWay payment created successfully.',
            'data' => $this->formatPayment($payment, $order),
        ], 201);
    }

    /**
     * Customer-facing: fetch a payment and, while it's still pending,
     * verify it against Bakong. This is the ONLY path that can mark a
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

        if ($payment->provider === 'payway') {
            $this->verifyPayWayPayment($payment, app(PayWayService::class));

            return response()->json([
                'success' => true,
                'message' => 'Payment status retrieved successfully.',
                'data' => $this->formatPayment($payment->fresh(), $order->fresh()),
            ]);
        }

        if ($payment->md5) {
            try {
                $verification = $bakong->verifyTransactionByMd5($payment->md5);
                if ($this->applyVerificationResult($payment, $order, $verification, $bakong)) {
                    $this->dispatchPaidDeliveryOrder($order->fresh());
                }
            } catch (BakongConfigurationException $exception) {
                Log::error('Bakong verification unavailable.', [
                    'payment_id' => $payment->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment status retrieved successfully.',
            'data' => $this->formatPayment($payment->fresh(), $order->fresh()),
        ]);
    }

    public function payWayCallback(Request $request, PayWayService $payWay): JsonResponse
    {
        $payload = array_merge($request->query(), $request->all());
        $transactionId = $payload['tran_id'] ?? $payload['transaction_id'] ?? null;

        if (! $transactionId) {
            return response()->json(['success' => false, 'message' => 'Missing transaction id.'], 422);
        }

        $payment = Payment::where('provider', 'payway')
            ->where('provider_transaction_id', $transactionId)
            ->first();

        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        }

        $payment->update(['callback_payload' => $payWay->callbackPayload($payload)]);
        $this->verifyPayWayPayment($payment, $payWay);

        return response()->json([
            'success' => true,
            'data' => $this->formatPayment($payment->fresh()),
        ]);
    }

    /**
     * @param  array{result: string, hash?: string|null, from_account_id?: string|null, to_account_id?: string|null, currency?: string|null, amount?: float|null}  $verification
     */
    private function applyVerificationResult(Payment $payment, Order $order, array $verification, BakongService $bakong): bool
    {
        if ($verification['result'] === 'success') {
            return $this->markPaidIfValid($payment, $order, $verification, $bakong);
        }

        if ($verification['result'] === 'failed') {
            $payment->update([
                'status' => PaymentStatuses::FAILED,
                'failed_reason' => 'Bakong reported this transaction as failed.',
            ]);
            $order->update(['payment_status' => PaymentStatuses::FAILED]);
        }

        // 'not_found' or 'error': no state change yet - the customer may not
        // have paid yet, or Bakong is momentarily unreachable. The frontend
        // keeps polling; expiry (checked above) is what eventually stops it.
        return false;
    }

    /**
     * @param  array{result: string, hash?: string|null, from_account_id?: string|null, to_account_id?: string|null, currency?: string|null, amount?: float|null}  $verification
     */
    private function markPaidIfValid(Payment $payment, Order $order, array $verification, BakongService $bakong): bool
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
                    'bakong_from_account_id' => $verification['from_account_id'] ?? null,
                    'bakong_to_account_id' => $verification['to_account_id'] ?? null,
                    'bakong_response' => [
                        'hash' => $hash,
                        'from_account_id' => $verification['from_account_id'] ?? null,
                        'to_account_id' => $verification['to_account_id'] ?? null,
                        'currency' => $verification['currency'] ?? null,
                        'amount' => $verification['amount'] ?? null,
                    ],
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

    private function verifyPayWayPayment(Payment $payment, PayWayService $payWay): bool
    {
        if (PaymentStatuses::isTerminal($payment->status)) {
            return false;
        }

        if (! $payment->provider_transaction_id) {
            return false;
        }

        $verification = $payWay->checkTransaction($payment->provider_transaction_id);

        if ($verification['result'] === 'success') {
            $markedPaid = $this->markPayWayPaidIfValid($payment, $payment->order, $verification);
            if ($markedPaid) {
                $this->dispatchPaidDeliveryOrder($payment->order->fresh());
            }

            return $markedPaid;
        }

        if (in_array($verification['result'], ['failed', 'cancelled'], true)) {
            $payment->update([
                'status' => PaymentStatuses::FAILED,
                'failed_reason' => $verification['result'] === 'cancelled'
                    ? 'PayWay reported this payment as cancelled.'
                    : 'PayWay reported this payment as declined or failed.',
                'gateway_response' => $verification['raw'] ?? $payment->gateway_response,
            ]);
            $payment->order->update(['payment_status' => PaymentStatuses::FAILED]);
        }

        return false;
    }

    /**
     * @param  array{result: string, transaction_id?: string|null, amount?: float|null, currency?: string|null, reference?: string|null, payment_type?: string|null, raw?: array<string, mixed>}  $verification
     */
    private function markPayWayPaidIfValid(Payment $payment, Order $order, array $verification): bool
    {
        $amountMatches = isset($verification['amount'])
            && abs((float) $verification['amount'] - (float) $payment->amount) < 0.01;
        $currencyMatches = strtoupper((string) ($verification['currency'] ?? '')) === strtoupper($payment->currency);
        $transactionMatches = ($verification['transaction_id'] ?? $payment->provider_transaction_id) === $payment->provider_transaction_id;

        if (! $amountMatches || ! $currencyMatches || ! $transactionMatches) {
            Log::warning('PayWay transaction verified but its details do not match the expected payment.', [
                'payment_id' => $payment->id,
                'expected_amount' => (float) $payment->amount,
                'expected_currency' => $payment->currency,
            ]);

            $payment->update([
                'status' => PaymentStatuses::FAILED,
                'failed_reason' => 'The PayWay transaction did not match the expected order amount, currency, or transaction.',
                'gateway_response' => $verification['raw'] ?? $payment->gateway_response,
            ]);
            $order->update(['payment_status' => PaymentStatuses::FAILED]);

            return false;
        }

        return DB::transaction(function () use ($payment, $order, $verification): bool {
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $locked || $locked->status !== PaymentStatuses::PENDING) {
                return false;
            }

            $locked->update([
                'status' => PaymentStatuses::PAID,
                'paid_at' => now(),
                'bakong_transaction_hash' => $verification['reference'] ?? $locked->bakong_transaction_hash,
                'gateway_response' => $verification['raw'] ?? $locked->gateway_response,
            ]);

            $order->update(['payment_status' => PaymentStatuses::PAID]);

            return true;
        });
    }

    private function dispatchPaidDeliveryOrder(Order $order): void
    {
        if ($order->order_type !== 'delivery' || $order->payment_status !== PaymentStatuses::PAID) {
            return;
        }

        $order->loadMissing(['delivery', 'restaurant', 'address']);

        if (! $order->delivery || $order->delivery->rider_id || ! $order->restaurant || ! $order->address) {
            return;
        }

        app(RiderMatchingService::class)->assignBestRider(
            $order,
            $order->delivery,
            $order->restaurant,
            $order->address
        );
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
            'checkout_url' => $payment->checkout_url,
            'checkout_html' => $payment->checkout_html,
            'deeplink' => $payment->deeplink,
            'expires_at' => $payment->expires_at?->toIso8601String(),
            'paid_at' => $payment->paid_at?->toIso8601String(),
            'failed_reason' => $payment->failed_reason,
        ];
    }

    private function payWayTransactionId(Order $order, string $paymentMethod): string
    {
        return 'O'.$order->id.strtoupper(substr($paymentMethod, 0, 1)).now('UTC')->format('His');
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
