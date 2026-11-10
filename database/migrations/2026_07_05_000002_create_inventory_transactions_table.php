<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('inventory_id');
            $table->foreign('inventory_id')->references('id')->on('inventories')->cascadeOnDelete();

            $table->enum('type', ['in', 'out', 'adjustment']);
            $table->decimal('quantity', 10, 2);
            $table->decimal('stock_after', 10, 2)->default(0);

            $table->text('notes')->nullable();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // User who did the transaction

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
