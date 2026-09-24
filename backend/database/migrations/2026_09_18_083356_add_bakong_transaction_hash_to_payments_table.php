<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Re-adds the one column the earlier PayWay/Bakong cleanup migration
 * dropped that direct-Bakong verification actually needs back: a unique
 * real-world bank transaction hash, so the same Bakong transfer can never
 * be applied to two different payments/orders. Everything else Bakong's
 * check_transaction_by_md5 response returns (from/to account, currency,
 * amount) is stored in the existing generic `gateway_response` json column
 * instead of dedicated columns, to avoid re-growing the schema back out.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->string('bakong_transaction_hash')->nullable()->unique()->after('md5');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropUnique(['bakong_transaction_hash']);
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn('bakong_transaction_hash');
        });
    }
};
