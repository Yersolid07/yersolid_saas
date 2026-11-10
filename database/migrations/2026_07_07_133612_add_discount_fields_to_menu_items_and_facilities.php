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
        Schema::table('menu_items', function (Blueprint $table) {
            $table->enum('discount_type', ['none', 'percentage', 'nominal'])->default('none')->after('price');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            $table->dateTime('promo_start')->nullable()->after('discount_value');
            $table->dateTime('promo_end')->nullable()->after('promo_start');
        });

        Schema::table('facilities', function (Blueprint $table) {
            $table->enum('discount_type', ['none', 'percentage', 'nominal'])->default('none')->after('is_active');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            $table->dateTime('promo_start')->nullable()->after('discount_value');
            $table->dateTime('promo_end')->nullable()->after('promo_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount_value', 'promo_start', 'promo_end']);
        });

        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount_value', 'promo_start', 'promo_end']);
        });
    }
};
