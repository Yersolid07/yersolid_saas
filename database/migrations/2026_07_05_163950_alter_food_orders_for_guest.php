<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('guest_name')->nullable()->after('user_id');
            $table->string('guest_phone')->nullable()->after('guest_name');
            $table->string('session_id')->nullable()->after('guest_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->dropColumn(['guest_name', 'guest_phone', 'session_id']);
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
