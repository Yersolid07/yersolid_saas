<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tambah lokasi "Inventaris Umum" (general) untuk barang non-stok
     * (printer, meja, alat, dll). Skip di sqlite karena tidak dukung ENUM.
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE inventories MODIFY COLUMN location ENUM('warehouse','kitchen','general') DEFAULT 'warehouse' NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE inventories MODIFY COLUMN location ENUM('warehouse','kitchen') DEFAULT 'warehouse' NOT NULL");
    }
};
