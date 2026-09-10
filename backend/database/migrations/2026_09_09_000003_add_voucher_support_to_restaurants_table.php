<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('restaurants', 'accepts_vouchers')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                $table->boolean('accepts_vouchers')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('restaurants', 'accepts_vouchers')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                $table->dropColumn('accepts_vouchers');
            });
        }
    }
};