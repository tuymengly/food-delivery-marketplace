<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drops the columns that only ever existed to serve ABA PayWay (card
 * checkout iframe/deeplink/callback storage) and the direct-Bakong
 * fallback, both now removed in favour of KHQR.LINK. The columns KHQR.LINK
 * actually needs - payment_method, provider, provider_transaction_id,
 * amount, currency, status, qr_string, qr_image, md5, gateway_response,
 * failed_reason, expires_at, paid_at - already existed and are reused as-is.
 */
return new class extends Migration
{
    public function up(): void
    {
        // The unique index on bakong_transaction_hash must be dropped in its
        // own statement first - SQLite's column-drop table rebuild trips
        // over a lingering unique index tied to a column being removed in
        // the same batch.
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropUnique(['bakong_transaction_hash']);
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn([
                'checkout_url',
                'checkout_html',
                'deeplink',
                'callback_payload',
                'bakong_transaction_hash',
                'bakong_from_account_id',
                'bakong_to_account_id',
                'bakong_response',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->text('checkout_url')->nullable()->after('qr_string');
            $table->longText('checkout_html')->nullable()->after('checkout_url');
            $table->text('deeplink')->nullable()->after('checkout_html');
            $table->json('callback_payload')->nullable()->after('gateway_response');
            $table->string('bakong_transaction_hash')->nullable()->after('md5');
            $table->string('bakong_from_account_id')->nullable()->after('bakong_transaction_hash');
            $table->string('bakong_to_account_id')->nullable()->after('bakong_from_account_id');
            $table->json('bakong_response')->nullable()->after('bakong_to_account_id');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->unique('bakong_transaction_hash');
        });
    }
};
