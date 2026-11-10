<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite does not support ENUM columns; use a CHECK constraint instead.
            Schema::table('reservations', function ($table) {
                $table->string('status')->default('pending')->change();
            });
        } else {
            DB::statement("ALTER TABLE reservations MODIFY COLUMN status ENUM('pending', 'confirmed', 'checked_in', 'cancelled', 'completed') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('reservations', function ($table) {
                $table->string('status')->default('pending')->change();
            });
        } else {
            DB::statement("ALTER TABLE reservations MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending'");
        }
    }
};
