<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('type', ['homestay', 'gazebo', 'pool', 'cafe']);
            $table->text('description')->nullable();
            $table->integer('capacity')->nullable();
            $table->decimal('price_per_day', 10, 2)->nullable();
            $table->decimal('price_per_hour', 10, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};
