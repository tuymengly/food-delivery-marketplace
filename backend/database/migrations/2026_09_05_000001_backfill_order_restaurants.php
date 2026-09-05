<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Repair orders created before restaurant_id was added by using their food owner.
        DB::table('orders')->orderBy('id')->get(['id'])->each(function (object $order): void {
            $restaurantId = DB::table('order_items')
                ->join('food', 'food.id', '=', 'order_items.food_id')
                ->where('order_items.order_id', $order->id)
                ->value('food.restaurant_id');

            if ($restaurantId) {
                DB::table('orders')
                    ->where('id', $order->id)
                    ->update(['restaurant_id' => $restaurantId]);
            }
        });
    }

    public function down(): void
    {
        // The original restaurant assignment cannot be reconstructed safely.
    }
};
