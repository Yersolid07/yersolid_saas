<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_closings', function (Blueprint $table) {
            $table->decimal('qris_expected', 15, 2)->default(0)->after('closing_balance');
            $table->decimal('qris_actual', 15, 2)->default(0)->after('qris_expected');
            $table->decimal('transfer_expected', 15, 2)->default(0)->after('qris_actual');
            $table->decimal('transfer_actual', 15, 2)->default(0)->after('transfer_expected');
            $table->decimal('edc_expected', 15, 2)->default(0)->after('transfer_actual');
            $table->decimal('edc_actual', 15, 2)->default(0)->after('edc_expected');
            $table->decimal('ewallet_expected', 15, 2)->default(0)->after('edc_actual');
            $table->decimal('ewallet_actual', 15, 2)->default(0)->after('ewallet_expected');
        });
    }

    public function down(): void
    {
        Schema::table('pos_closings', function (Blueprint $table) {
            $table->dropColumn([
                'qris_expected',
                'qris_actual',
                'transfer_expected',
                'transfer_actual',
                'edc_expected',
                'edc_actual',
                'ewallet_expected',
                'ewallet_actual',
            ]);
        });
    }
};
