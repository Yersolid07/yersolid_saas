<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // cost_price: harga pokok per menu, untuk gross margin per item.
        // Nullable + default 0 supaya item lama tidak error, owner isi bertahap.
        Schema::table('menu_items', function (Blueprint $table) {
            if (!Schema::hasColumn('menu_items', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->nullable()->after('price');
            }
        });

        // Snapshot harian untuk BI: agregasi ringan, cepat, bisa dibanding lintas periode.
        Schema::create('bi_daily_snapshots', function (Blueprint $table) {
            $table->date('date')->primary();
            $table->decimal('revenue', 14, 2)->default(0);
            $table->decimal('expense', 14, 2)->default(0);
            $table->decimal('net_profit', 14, 2)->default(0);
            $table->decimal('avg_order_value', 14, 2)->default(0);
            $table->unsignedInteger('reservations_count')->default(0);
            $table->unsignedInteger('reservations_paid')->default(0);
            $table->unsignedInteger('reservations_cancelled')->default(0);
            $table->unsignedInteger('food_orders_count')->default(0);
            $table->unsignedInteger('food_orders_paid')->default(0);
            $table->unsignedInteger('food_orders_cancelled')->default(0);
            $table->unsignedInteger('visitors')->default(0);
            $table->unsignedInteger('new_customers')->default(0);
            $table->unsignedInteger('returning_customers')->default(0);
            $table->decimal('stock_value', 14, 2)->default(0);
            $table->unsignedInteger('stockout_count')->default(0);
            $table->decimal('waste_value', 14, 2)->default(0);
            $table->decimal('occupancy_rate', 6, 2)->default(0);
            $table->decimal('refund_amount', 14, 2)->default(0);
            $table->decimal('gateway_fee', 14, 2)->default(0);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bi_daily_snapshots');
        Schema::table('menu_items', function (Blueprint $table) {
            if (Schema::hasColumn('menu_items', 'cost_price')) {
                $table->dropColumn('cost_price');
            }
        });
    }
};
