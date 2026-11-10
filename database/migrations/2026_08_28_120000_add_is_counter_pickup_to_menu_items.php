<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Counter-pickup items (Snack, pop mie, aqua, teh pucuk, minuman botol, dst)
     * diambil langsung di kasir -> TIDAK masuk antrian KDS.
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->boolean('is_counter_pickup')->default(false)->after('is_available');
        });

        // Seed: Snack + item kemasan/instan otomatis counter-pickup
        DB::table('menu_items')
            ->where('category', 'snack')
            ->update(['is_counter_pickup' => true]);

        DB::table('menu_items')
            ->where(function ($q) {
                $q->where('category', 'snack')
                    ->orWhere('name', 'like', '%pop mie%')
                    ->orWhere('name', 'like', '%aqua%')
                    ->orWhere('name', 'like', '%teh pucuk%')
                    ->orWhere('name', 'like', '%teh botol%')
                    ->orWhere('name', 'like', '%pucuk%')
                    ->orWhere('name', 'like', '%susu botol%')
                    ->orWhere('name', 'like', '%minuman botol%')
                    ->orWhere('name', 'like', '%klepon%')
                    ->orWhere('name', 'like', '%kemasan%');
            })
            ->update(['is_counter_pickup' => true]);
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('is_counter_pickup');
        });
    }
};
