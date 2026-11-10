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
        Schema::table('food_orders', function (Blueprint $table) {
            if (Schema::hasColumn('food_orders', 'guest_name')) {
                $table->dropColumn('guest_name');
            }
            if (Schema::hasColumn('food_orders', 'guest_phone')) {
                $table->dropColumn('guest_phone');
            }

            // Ensure customer_phone exists (customer_name was added in previous migration)
            if (! Schema::hasColumn('food_orders', 'customer_phone')) {
                $table->string('customer_phone')->nullable()->after('customer_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            if (! Schema::hasColumn('food_orders', 'guest_name')) {
                $table->string('guest_name')->nullable();
            }
            if (! Schema::hasColumn('food_orders', 'guest_phone')) {
                $table->string('guest_phone')->nullable();
            }
            if (Schema::hasColumn('food_orders', 'customer_phone')) {
                $table->dropColumn('customer_phone');
            }
        });
    }
};
