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
        Schema::create('q_r_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('label'); // Name or description for admin to identify easily
            $table->string('location_type'); // 'table', 'facility', 'other'
            $table->uuid('location_id')->nullable(); // Reference to facility_id if facility
            $table->string('table_number')->nullable(); // Table number if table
            $table->string('image_path'); // Path to stored image
            $table->string('url'); // The actual URL encoded in the QR
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('q_r_codes');
    }
};
