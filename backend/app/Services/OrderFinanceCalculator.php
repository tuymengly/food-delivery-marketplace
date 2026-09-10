<?php

namespace App\Services;

/**
 * Splits a customer's payment into what the restaurant, the rider, and the
 * platform each keep. Computed once at order creation and persisted on the
 * order (see the order_finance columns), never recalculated later from the
 * live commission rate — so changing the platform rate never rewrites the
 * economics of an already-placed order.
 *
 * Split rule (matches the marketplace's commission agreement):
 *   - The platform takes a commission out of the food subtotal only.
 *   - The rider keeps the entire delivery fee.
 *   - The restaurant keeps the rest of the subtotal.
 *   - Platform profit is whatever remains of the customer's total once the
 *     restaurant and rider have been paid, so service fees/discounts/etc.
 *     always net out correctly against the platform, never silently vanish.
 */
final class OrderFinanceCalculator
{
    public static function commissionRate(): float
    {
        return (float) config('marketplace.commission_rate', 0.10);
    }

    /**
     * @return array{restaurant_amount: float, rider_amount: float, platform_fee: float, platform_profit: float}
     */
    public static function breakdown(float $subtotal, float $deliveryFee, float $total): array
    {
        $rate = self::commissionRate();
        $platformFee = round($subtotal * $rate, 2);
        $restaurantAmount = round($subtotal - $platformFee, 2);
        $riderAmount = round($deliveryFee, 2);
        $platformProfit = round($total - $restaurantAmount - $riderAmount, 2);

        return [
            'restaurant_amount' => $restaurantAmount,
            'rider_amount' => $riderAmount,
            'platform_fee' => $platformFee,
            'platform_profit' => $platformProfit,
        ];
    }
}
