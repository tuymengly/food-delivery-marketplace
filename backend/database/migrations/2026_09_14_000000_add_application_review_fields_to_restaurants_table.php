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
        Schema::table('restaurants', function (Blueprint $table): void {
            $table->json('opening_hours')->nullable()->after('avg_delivery_time');
            $table->json('photos')->nullable()->after('image');
            $table->json('documents')->nullable()->after('photos');
            $table->text('rejection_reason')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table): void {
            $table->dropColumn(['opening_hours', 'photos', 'documents', 'rejection_reason']);
        });
    }
};
