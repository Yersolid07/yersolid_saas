<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix the food_orders.payment_status enum.
     *
     * Root cause: app code (OrderService, PaymentService) inserts
     * payment_status = 'pending' for new orders, and FoodOrderController::updateStatus()
     * writes 'refunded' on cancel. The original enum ['unpaid','paid'] supported
     * NEITHER, causing "Data truncated" warnings that silently corrupted the column.
     *
     * Correct enum = pending (new order) + unpaid/paid (legacy) + refunded (cancel).
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE food_orders MODIFY COLUMN payment_status ENUM('pending','unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid'");
    }

    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        // Pre-audit state actually used by the app (pending + unpaid/paid).
        DB::statement("ALTER TABLE food_orders MODIFY COLUMN payment_status ENUM('pending','unpaid','paid') NOT NULL DEFAULT 'unpaid'");
    }
};
