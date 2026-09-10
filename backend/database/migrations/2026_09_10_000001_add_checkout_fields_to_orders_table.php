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
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('order_type')->default('delivery')->after('address_id');
            $table->string('payment_method')->nullable()->after('order_type');
            $table->text('notes')->nullable()->after('payment_method');
            $table->decimal('service_fee', 10, 2)->default(0)->after('delivery_fee');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('service_fee');
            $table->string('voucher_code')->nullable()->after('discount_amount');
            $table->foreignId('voucher_id')->nullable()->after('voucher_code')->constrained('vouchers')->nullOnDelete();
        });

        // Pickup orders have no delivery address, so this can no longer be a
        // hard requirement at the database level.
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['address_id']);
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->unsignedBigInteger('address_id')->nullable()->change();
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreign('address_id')->references('id')->on('addresses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['voucher_id']);
            $table->dropColumn(['order_type', 'payment_method', 'notes', 'service_fee', 'discount_amount', 'voucher_code', 'voucher_id']);
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['address_id']);
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->unsignedBigInteger('address_id')->nullable(false)->change();
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreign('address_id')->references('id')->on('addresses')->restrictOnDelete();
        });
    }
};
