<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PayoutCalculationService;
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
}
