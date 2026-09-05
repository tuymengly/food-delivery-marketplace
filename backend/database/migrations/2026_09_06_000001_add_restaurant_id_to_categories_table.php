<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            $table->foreignId('restaurant_id')->nullable()->after('id')->constrained('restaurants')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            $table->dropForeign(['restaurant_id']);
            $table->dropColumn('restaurant_id');
        });
    }
};
