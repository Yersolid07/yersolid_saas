<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds guest-identification columns to reservations and food_orders,
     * and makes user_id nullable to support guest (unauthenticated) bookings.
     *
     * Uses database-agnostic foreign key checks (works with MySQL and SQLite).
     */
    public function up(): void
    {
        // --- Reservations ---
        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();

            if (! Schema::hasColumn('reservations', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('user_id');
            }
            if (! Schema::hasColumn('reservations', 'customer_email')) {
                $table->string('customer_email')->nullable()->after('customer_name');
            }
            if (! Schema::hasColumn('reservations', 'customer_phone')) {
                $table->string('customer_phone')->nullable()->after('customer_email');
            }
        });

        // Re-add nullable FK for reservations (drop-and-recreate safely)
        $this->safelyRecreateForeignKey(
            'reservations',
            'user_id',
            'reservations_user_id_foreign',
            'users',
            'id',
            'set null'
        );

        // --- Food Orders ---
        Schema::table('food_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();

            if (! Schema::hasColumn('food_orders', 'customer_name')) {
                $table->string('customer_name')->nullable()->after('user_id');
            }
            if (! Schema::hasColumn('food_orders', 'table_number')) {
                $table->string('table_number')->nullable()->after('customer_name');
            }
        });

        // Re-add nullable FK for food_orders
        $this->safelyRecreateForeignKey(
            'food_orders',
            'user_id',
            'food_orders_user_id_foreign',
            'users',
            'id',
            'set null'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            try {
                $table->dropForeign(['user_id']);
            } catch (Throwable $e) {
            }
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            try {
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            } catch (Throwable $e) {
            }
            $table->dropColumn(array_filter(
                ['customer_name', 'customer_email', 'customer_phone'],
                fn ($col) => Schema::hasColumn('reservations', $col)
            ));
        });

        Schema::table('food_orders', function (Blueprint $table) {
            try {
                $table->dropForeign(['user_id']);
            } catch (Throwable $e) {
            }
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            try {
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            } catch (Throwable $e) {
            }
            $table->dropColumn(array_filter(
                ['customer_name', 'table_number'],
                fn ($col) => Schema::hasColumn('food_orders', $col)
            ));
        });
    }

    /**
     * Safely drop (if exists) then recreate a foreign key.
     * Works with both MySQL and SQLite test environments.
     */
    private function safelyRecreateForeignKey(
        string $table,
        string $column,
        string $constraintName,
        string $referencedTable,
        string $referencedColumn,
        string $onDelete
    ): void {
        // Skip FK constraints for SQLite (used in testing) — SQLite has very limited ALTER TABLE
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table($table, function (Blueprint $t) use ($column, $constraintName, $referencedTable, $referencedColumn, $onDelete) {
            // Try to drop if already exists
            try {
                $t->dropForeign($constraintName);
            } catch (Throwable $e) {
                // FK didn't exist — that's fine
            }
            // Re-add with nullable on-delete
            $t->foreign($column)->references($referencedColumn)->on($referencedTable)->onDelete($onDelete);
        });
    }
};
