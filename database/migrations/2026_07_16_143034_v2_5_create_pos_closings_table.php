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
        Schema::create('pos_closings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id'); // Staff who closed the POS
            $table->date('date');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->default(0); // System expected balance
            $table->decimal('actual_balance', 15, 2)->default(0); // Actual physical cash
            $table->decimal('difference', 15, 2)->default(0);
            $table->integer('cash_100k')->default(0);
            $table->integer('cash_50k')->default(0);
            $table->integer('cash_20k')->default(0);
            $table->integer('cash_10k')->default(0);
            $table->integer('cash_5k')->default(0);
            $table->integer('cash_2k')->default(0);
            $table->integer('cash_1k')->default(0);
            $table->integer('total_cash_calculated')->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_closings');
    }
};
