<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Orthogonal to the delivery-lifecycle `status` column (see
     * OrderStatuses) - this tracks whether the order has actually been
     * paid for gateway-tracked methods like KHQR. Null means "not tracked
     * by a payment gateway" (e.g. cash on delivery).
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('payment_status', 20)->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn('payment_status');
        });
    }
};
