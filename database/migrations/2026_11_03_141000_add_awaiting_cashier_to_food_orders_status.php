<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * #3 — Gerbang kasir untuk pesanan online.
 *
 * Menambah status 'awaiting_cashier' ke food_orders.status (ADDITIVE).
 * Order online yang sudah bayar via Tripay TIDAK langsung masuk KDS;
 * kasir harus ACC dulu (-> 'pending') atau Tolak (-> 'cancelled').
 *
 * PERINGATAN: nilai lama WAJIB dipertahankan semua
 * (pending, preparing, ready, delivered, completed, cancelled).
 */
return new class extends Migration
{
    private const OLD = "ENUM('pending','preparing','ready','delivered','completed','cancelled')";

    private const NEW = "ENUM('awaiting_cashier','pending','preparing','ready','delivered','completed','cancelled')";

    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE food_orders MODIFY COLUMN status '.self::NEW." NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::table('food_orders')->where('status', 'awaiting_cashier')->update(['status' => 'pending']);
        DB::statement('ALTER TABLE food_orders MODIFY COLUMN status '.self::OLD." NOT NULL DEFAULT 'pending'");
    }
};
