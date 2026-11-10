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
        Schema::table('reservations', function (Blueprint $table) {
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
        });

        Schema::table('food_orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('created_at');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('payment_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('food_orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['created_at']);
        });
    }
};
