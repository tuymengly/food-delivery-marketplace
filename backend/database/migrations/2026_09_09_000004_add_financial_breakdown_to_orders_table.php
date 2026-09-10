<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            if (!Schema::hasColumn('orders', 'restaurant_amount')) {
                $table->decimal('restaurant_amount', 10, 2)->nullable()->after('total_price');
            }
            if (!Schema::hasColumn('orders', 'rider_amount')) {
                $table->decimal('rider_amount', 10, 2)->nullable()->after('restaurant_amount');
            }
            if (!Schema::hasColumn('orders', 'platform_fee')) {
                $table->decimal('platform_fee', 10, 2)->nullable()->after('rider_amount');
            }
            if (!Schema::hasColumn('orders', 'platform_profit')) {
                $table->decimal('platform_profit', 10, 2)->nullable()->after('platform_fee');
            }
        });

        // Backfill existing orders using the same split rule so admin/restaurant/
        // rider finance views aren't missing data for orders placed before this
        // migration. New orders compute and store this at creation time instead
        // (see OrderFinanceCalculator) and are never recalculated afterwards.
        $rate = (float) env('PLATFORM_COMMISSION_RATE', 0.10);

        DB::table('orders')->orderBy('id')->chunk(200, function ($orders) use ($rate): void {
            foreach ($orders as $order) {
                $subtotal = (float) $order->subtotal;
                $deliveryFee = (float) $order->delivery_fee;
                $total = (float) ($order->total_price ?? $order->total);

                $platformFee = round($subtotal * $rate, 2);
                $restaurantAmount = round($subtotal - $platformFee, 2);
                $riderAmount = round($deliveryFee, 2);
                $platformProfit = round($total - $restaurantAmount - $riderAmount, 2);

                DB::table('orders')->where('id', $order->id)->update([
                    'restaurant_amount' => $restaurantAmount,
                    'rider_amount' => $riderAmount,
                    'platform_fee' => $platformFee,
                    'platform_profit' => $platformProfit,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['restaurant_amount', 'rider_amount', 'platform_fee', 'platform_profit']);
        });
    }
};
