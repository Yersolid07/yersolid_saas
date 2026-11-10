<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('reservation_id')->nullable();
            $table->foreign('reservation_id')->references('id')->on('reservations')->nullOnDelete();
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'preparing', 'ready', 'delivered', 'cancelled'])->default('pending');
            $table->enum('order_type', ['dine_in', 'takeaway', 'room_service'])->default('dine_in');
            $table->string('table_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('food_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->foreign('order_id')->references('id')->on('food_orders')->cascadeOnDelete();
            $table->uuid('menu_item_id');
            $table->foreign('menu_item_id')->references('id')->on('menu_items')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_order_items');
        Schema::dropIfExists('food_orders');
    }
};
