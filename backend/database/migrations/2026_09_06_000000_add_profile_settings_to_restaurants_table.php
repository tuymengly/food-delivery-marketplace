<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table): void {
            $table->string('cuisine')->nullable()->after('name');
            $table->decimal('delivery_fee', 10, 2)->nullable()->after('phone');
            $table->decimal('min_order', 10, 2)->nullable()->after('delivery_fee');
            $table->string('avg_delivery_time')->nullable()->after('min_order');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table): void {
            $table->dropColumn(['cuisine', 'delivery_fee', 'min_order', 'avg_delivery_time']);
        });
    }
};
