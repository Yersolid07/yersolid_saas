<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Meja dianggap "kosong" hanya setelah status 'completed' (kasir/dapur
     * klik "Selesai & Bebasin Meja"). Tambahkan nilai ini ke ENUM status
     * food_orders — sebelumnya hanya sampai 'cancelled'.
     */
    public function up(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->enum('status', [
                'pending',
                'preparing',
                'ready',
                'delivered',
                'completed',
                'cancelled',
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->enum('status', [
                'pending',
                'preparing',
                'ready',
                'delivered',
                'cancelled',
            ])->default('pending')->change();
        });
    }
};
