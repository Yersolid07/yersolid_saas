<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Prod DB (MariaDB) enum masih 5 nilai — migration lama
     * `add_other_income_and_toiletries_to_menu_items_category` ditandai Ran tapi
     * ALTER-nya tidak pernah benar-benar ngelewatin `other_income`/`toiletries`.
     * Migration ini "memperbaiki" enum ke 7 nilai yang benar untuk MariaDB,
     * dan skip di sqlite (test DB) karena sqlite tidak dukung ENUM.
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE menu_items MODIFY COLUMN category ENUM('makanan','minuman','snack','dessert','tiket','other_income','toiletries') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE menu_items MODIFY COLUMN category ENUM('makanan','minuman','snack','dessert','tiket') NOT NULL");
    }
};
