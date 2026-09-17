<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Pickup orders must never be surfaced to riders and restaurant
            // dashboards filter/group orders by fulfillment type, so both
            // paths benefit from an index instead of a full table scan.
            $table->index(['order_type'], 'orders_order_type_index');
            $table->index(['restaurant_id', 'order_type'], 'orders_restaurant_id_order_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_order_type_index');
            $table->dropIndex('orders_restaurant_id_order_type_index');
        });
    }
};
