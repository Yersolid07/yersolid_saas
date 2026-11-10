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
        if (config('database.default') === 'sqlite') {
            return;
        }

        // Because doctrine/dbal might not support modifying ENUM columns easily,
        // we'll use a raw query to change it to VARCHAR.
        DB::statement("ALTER TABLE financial_transactions MODIFY COLUMN category VARCHAR(255) NOT NULL DEFAULT 'other'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        // Revert back to enum
        DB::statement("ALTER TABLE financial_transactions MODIFY COLUMN category ENUM('reservation','cafe','inventory','manual','other','inventory_purchase','inventory_loss','inventory_adjustment') NOT NULL DEFAULT 'other'");
    }
};
