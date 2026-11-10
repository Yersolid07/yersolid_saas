<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reservation_id')->nullable();
            $table->foreign('reservation_id')->references('id')->on('reservations')->nullOnDelete();
            $table->uuid('food_order_id')->nullable();
            $table->foreign('food_order_id')->references('id')->on('food_orders')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['cash', 'transfer', 'credit_card', 'ewallet', 'tripay', 'midtrans']);
            $table->enum('payment_status', ['pending', 'success', 'failed', 'refunded'])->default('pending');
            $table->string('transaction_id')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('proof_image')->nullable();
            $table->json('gateway_response')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
