<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The original enum did not include 'inventory_purchase' and 'inventory_loss'
     * which are used by InventoryController. This migration widens the category
     * column to cover all actual values written in the application.
     */
    public function up(): void
    {
        // SQLite (used in tests) does not support column type modification
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // MySQL: alter ENUM by modifying the column
        DB::statement("ALTER TABLE financial_transactions 
            MODIFY COLUMN category ENUM(
                'reservation', 'cafe', 'inventory', 'manual', 'other',
                'inventory_purchase', 'inventory_loss', 'inventory_adjustment'
            ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // First update any non-original values to 'other' to avoid data loss
        DB::table('financial_transactions')
            ->whereIn('category', ['inventory_purchase', 'inventory_loss', 'inventory_adjustment'])
            ->update(['category' => 'inventory']);

        DB::statement("ALTER TABLE financial_transactions 
            MODIFY COLUMN category ENUM(
                'reservation', 'cafe', 'inventory', 'manual', 'other'
            ) NOT NULL");
    }
};
