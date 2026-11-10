<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') !== 'sqlite') {
            DB::statement("ALTER TABLE menu_items MODIFY COLUMN category ENUM('makanan', 'minuman', 'snack', 'dessert', 'tiket') NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') !== 'sqlite') {
            DB::statement("ALTER TABLE menu_items MODIFY COLUMN category ENUM('makanan', 'minuman', 'snack', 'dessert') NOT NULL");
        }
    }
};
