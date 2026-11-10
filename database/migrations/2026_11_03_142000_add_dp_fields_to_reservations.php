<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * #4 — DP / deposit reservasi (pukul rata Rp 100.000, semua fasilitas).
 *
 * Masalah lama: `Payment` adalah HasOne pada Reservation, sehingga DP lalu
 * pelunasan TIDAK bisa tercatat dua-duanya. Solusi additive:
 *  1. payment_type += 'dp','pelunasan' sudah ada; kita tambah 'deposit'
 *     untuk penanda setoran manual (reservasi di luar app).
 *  2. Kolom `reservations.dp_amount` (nominal DP yang disepakati, default 100000)
 *     dan `reservations.dp_paid_at` (kapan DP masuk).
 *
 * Relasi HasOne TETAP dipertahankan agar 4.826 payment produksi tidak pecah.
 * Untuk multi-payment, Reservation mendapat accessor `payments` (query, bukan
 * relasi Eloquent HasMany) — lihat model Reservation::paymentHistory().
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN payment_type ENUM('booking','dp','deposit','pelunasan') NOT NULL DEFAULT 'booking'");
        }

        Schema::table('reservations', function (Blueprint $table) {
            if (! Schema::hasColumn('reservations', 'dp_amount')) {
                $table->decimal('dp_amount', 12, 2)->default(100000)->after('guarantee_fee');
            }
            if (! Schema::hasColumn('reservations', 'dp_paid_at')) {
                $table->timestamp('dp_paid_at')->nullable()->after('dp_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            if (Schema::hasColumn('reservations', 'dp_paid_at')) {
                $table->dropColumn('dp_paid_at');
            }
            if (Schema::hasColumn('reservations', 'dp_amount')) {
                $table->dropColumn('dp_amount');
            }
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::table('payments')->whereIn('payment_type', ['dp', 'deposit'])->update(['payment_type' => 'booking']);
            DB::statement("ALTER TABLE payments MODIFY COLUMN payment_type ENUM('booking','pelunasan') NOT NULL DEFAULT 'booking'");
        }
    }
};
