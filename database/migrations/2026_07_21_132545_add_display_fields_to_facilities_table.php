<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->string('price_prefix')->default('Mulai dari')->after('price_per_hour');
            $table->string('price_unit')->default('/malam')->after('price_prefix');
            $table->integer('bed_count')->nullable()->after('price_unit');
        });
    }

    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->dropColumn(['price_prefix', 'price_unit', 'bed_count']);
        });
    }
};
