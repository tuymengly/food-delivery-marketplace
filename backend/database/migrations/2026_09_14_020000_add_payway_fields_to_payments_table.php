<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->string('provider', 30)->default('bakong')->after('payment_method');
            $table->string('provider_transaction_id', 40)->nullable()->unique()->after('provider');
            $table->text('checkout_url')->nullable()->after('qr_string');
            $table->longText('checkout_html')->nullable()->after('checkout_url');
            $table->text('deeplink')->nullable()->after('checkout_html');
            $table->longText('qr_image')->nullable()->after('deeplink');
            $table->json('gateway_response')->nullable()->after('bakong_response');
            $table->json('callback_payload')->nullable()->after('gateway_response');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn([
                'provider',
                'provider_transaction_id',
                'checkout_url',
                'checkout_html',
                'deeplink',
                'qr_image',
                'gateway_response',
                'callback_payload',
            ]);
        });
    }
};
