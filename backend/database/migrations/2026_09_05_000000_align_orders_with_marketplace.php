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
            $table->foreignId('restaurant_id')
                ->nullable()
                ->after('user_id')
                ->constrained('restaurants')
                ->nullOnDelete();
            $table->decimal('total_price', 10, 2)->nullable()->after('total');
        });

        // Keep the legacy total column and the marketplace total in sync.
        DB::table('orders')->update([
            'total_price' => DB::raw('total'),
        ]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['restaurant_id']);
            $table->dropColumn(['restaurant_id', 'total_price']);
        });
    }
};
