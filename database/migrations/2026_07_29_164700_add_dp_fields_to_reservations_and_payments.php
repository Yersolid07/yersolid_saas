<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->enum('payment_preference', ['full', 'dp'])->default('full')->after('payment_status');
            $table->decimal('guarantee_fee', 10, 2)->default(0)->after('total_amount');
        });

        if (config('database.default') !== 'sqlite') {
            DB::statement("ALTER TABLE reservations MODIFY COLUMN payment_status ENUM('unpaid', 'dp_paid', 'paid', 'refunded') DEFAULT 'unpaid' NOT NULL");
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('payment_type', ['booking', 'pelunasan'])->default('booking')->after('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('payment_type');
        });

        if (config('database.default') !== 'sqlite') {
            DB::statement("ALTER TABLE reservations MODIFY COLUMN payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid' NOT NULL");
        }

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['payment_preference', 'guarantee_fee']);
        });
    }
};
