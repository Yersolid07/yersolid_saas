<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bi_decisions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('hypothesis')->nullable();
            $table->string('metric')->nullable();
            $table->string('target')->nullable();
            $table->date('evaluate_at')->nullable();
            $table->enum('status', ['direncanakan', 'berjalan', 'terbukti', 'tidak_berhasil'])->default('direncanakan');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('result_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bi_decisions');
    }
};
