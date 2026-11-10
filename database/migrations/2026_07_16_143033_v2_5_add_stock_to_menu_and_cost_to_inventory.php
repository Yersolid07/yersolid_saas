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
            $table->integer('daily_stock')->nullable()->after('image_url');
            $table->integer('current_stock')->default(0)->after('daily_stock');
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->decimal('cost', 15, 2)->default(0)->after('stock_after');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['daily_stock', 'current_stock']);
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropColumn('cost');
        });
    }
};
