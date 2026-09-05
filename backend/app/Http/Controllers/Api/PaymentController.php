<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    private array $paidStatuses = ['completed', 'Completed', 'delivered', 'Delivered'];

    public function getStatsAndTransactions(Request $request): JsonResponse
    {
        $paidOrders = Order::with(['user:id,name', 'restaurant:id,name'])
            ->whereIn('status', $this->paidStatuses)
            ->latest()
            ->get();

        $totalVolume = (float) $paidOrders->sum('total_price');
        $platformRevenue = $totalVolume * 0.10;
        $restaurantPayouts = $totalVolume * 0.90;

        $transactions = $paidOrders
            ->take(20)
            ->map(function (Order $order) {
                $amount = (float) ($order->total_price ?? 0);

                return [
                    'id' => 'TXN-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                    'dateTime' => $order->created_at ? $order->created_at->format('M d, H:i') : 'N/A',
                    'entity' => $order->restaurant->name ?? 'Restaurant',
                    'type' => 'Restaurant Payout',
                    'amount' => round($amount * 0.90, 2),
                    'status' => 'Pending',
                    'category' => 'restaurant',
                    'avatar' => null,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_volume' => $totalVolume,
                    'platform_revenue' => round($platformRevenue, 2),
                    'pending_payouts' => round($restaurantPayouts, 2),
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
}
