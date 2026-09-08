<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The original users migration already defines a `status` column, but this
 * environment's database was created before that line existed and was never
 * re-synced, so the column is missing in practice even though the migration
 * shows as run. This backfills it without touching anything else.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('status')->default('Active')->after('role');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('status');
            });
        }
    }
};
