<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * #2 — Pisahkan lokasi inventori menjadi gudang / dapur / cafe.
 *
 * ADDITIVE ONLY: menambah nilai 'cafe' ke enum, TIDAK menghapus nilai lama.
 * Backfill 'cafe' dilakukan terpisah lewat command `stock:backfill-cafe`
 * setelah data dianalisis, bukan di dalam migrasi (agar migrasi reversibel & cepat).
 */
return new class extends Migration
{
    public function up(): void
    {
        // MariaDB: perlu deklarasi ulang seluruh daftar enum.
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE inventories MODIFY COLUMN location ENUM('warehouse','kitchen','cafe','general') NOT NULL DEFAULT 'warehouse'");
        }

        if (! Schema::hasColumn('inventories', 'menu_item_id')) {
            Schema::table('inventories', function (Blueprint $table) {
                $table->char('menu_item_id', 36)->nullable()->after('barcode');
                $table->index('menu_item_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('inventories', 'menu_item_id')) {
            Schema::table('inventories', function (Blueprint $table) {
                $table->dropIndex(['menu_item_id']);
                $table->dropColumn('menu_item_id');
            });
        }

        // Kembalikan enum lama — pastikan tidak ada baris 'cafe' tersisa.
        if (DB::getDriverName() !== 'sqlite') {
            DB::table('inventories')->where('location', 'cafe')->update(['location' => 'kitchen']);
            DB::statement("ALTER TABLE inventories MODIFY COLUMN location ENUM('warehouse','kitchen','general') NOT NULL DEFAULT 'warehouse'");
        }
    }
};
