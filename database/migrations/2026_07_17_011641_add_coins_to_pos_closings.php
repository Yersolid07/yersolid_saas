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
        Schema::table('pos_closings', function (Blueprint $table) {
            $table->integer('coins')->default(0)->after('cash_1k');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pos_closings', function (Blueprint $table) {
            $table->dropColumn('coins');
        });
    }
};
