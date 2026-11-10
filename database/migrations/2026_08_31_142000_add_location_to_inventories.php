<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            if (! Schema::hasColumn('inventories', 'location')) {
                $table->enum('location', ['warehouse', 'kitchen'])
                    ->default('warehouse')
                    ->after('category');
            }
        });

        // Existing 61 rows are raw materials / warehouse stock.
        DB::statement("UPDATE inventories SET location = 'warehouse' WHERE location IS NULL OR location = ''");
    }

    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            if (Schema::hasColumn('inventories', 'location')) {
                $table->dropColumn('location');
            }
        });
    }
};
