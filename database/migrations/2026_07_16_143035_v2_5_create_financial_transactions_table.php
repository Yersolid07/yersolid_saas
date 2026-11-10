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
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['income', 'expense']);
            $table->enum('category', ['reservation', 'cafe', 'inventory', 'manual', 'other']);
            $table->decimal('amount', 15, 2);
            $table->uuid('reference_id')->nullable(); // Can refer to reservation_id, food_order_id, inventory_transaction_id
            $table->text('description')->nullable();
            $table->date('transaction_date');
            $table->unsignedBigInteger('user_id')->nullable(); // Who recorded it
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
