<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom status per-item di food_order_items agar KDS bisa
     * menandai item mana yang sudah diantar secara individu (bukan per order).
     * Nilai: pending -> preparing -> ready -> delivered
     */
    public function up(): void
    {
        Schema::table('food_order_items', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('notes');
        });

        // Backfill: item mengikuti status order induknya agar konsisten.
        // delivered -> delivered, ready -> ready (BELUM diantar, jangan delivered),
        // sisanya (pending/preparing) biarkan default 'pending'.
        DB::statement(
            "UPDATE food_order_items SET status = 'delivered' WHERE order_id IN (SELECT id FROM food_orders WHERE status = 'delivered')"
        );
        DB::statement(
            "UPDATE food_order_items SET status = 'ready' WHERE order_id IN (SELECT id FROM food_orders WHERE status = 'ready')"
        );
    }

    public function down(): void
    {
        Schema::table('food_order_items', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
