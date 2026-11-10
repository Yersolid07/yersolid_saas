<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

if (! function_exists('normalizeGazeboName')) {
    function normalizeGazeboName(string $raw): string
    {
        $name = preg_replace_callback('/\b(\w+)\b/i', fn ($x) => ucfirst(strtolower($x[1])), trim($raw));
        $name = preg_replace('/(\d+)/', ' $1', $name);

        return preg_replace('/\s+/', ' ', trim($name));
    }
}

/**
 * Consolidated fix migration (idempotent — safe to re-run):
 *  1. inventory_transactions: add `total_cost` (reporting uses it). Backfill = cost.
 *  2. gazebos: ensure table exists & is seeded from facilities + QR table labels.
 *  3. q_r_codes: add `gazebo_id` FK (if missing) and backfill from table labels.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Relax strict mode for the seed inserts below (ULID/FK lengths).
        try {
            DB::statement("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'STRICT_TRANS_TABLES',''))");
        } catch (Throwable $e) { /* ignore */
        }

        // ── 1. inventory_transactions.total_cost ──────────────────────────
        if (! Schema::hasColumn('inventory_transactions', 'total_cost')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->decimal('total_cost', 15, 2)->default(0)->after('cost');
            });
            // `cost` already stores the total transaction cost → mirror it.
            DB::statement('UPDATE inventory_transactions SET total_cost = cost WHERE total_cost = 0');
        }

        // ── 2. gazebos table + seed ───────────────────────────────────────
        if (! Schema::hasTable('gazebos')) {
            Schema::create('gazebos', function (Blueprint $table) {
                $table->char('id', 36)->primary();
                $table->string('name');
                $table->char('facility_id', 36)->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
                $table->foreign('facility_id')->references('id')->on('facilities')->nullOnDelete();
            });
        }

        // Collect unique gazebo names from:
        //   (a) facilities where type = 'gazebo'
        //   (b) QR table labels like "Kawasar 1 Meja 03", "Pondo 01"
        $gazeboNames = [];

        foreach (DB::table('facilities')->where('type', 'gazebo')->pluck('name') as $fg) {
            $gazeboNames[normalizeGazeboName($fg)] = true;
        }

        if (Schema::hasTable('q_r_codes')) {
            foreach (DB::table('q_r_codes')->where('location_type', 'table')->get() as $qr) {
                if (preg_match('/^(.+?)\s+Meja/i', $qr->label, $m)) {
                    $gazeboNames[normalizeGazeboName($m[1])] = true;
                } elseif (preg_match('/^(Pondo)\s*\d+/i', $qr->label, $m)) {
                    // "Pondo 01" style → treat whole prefix as gazebo group
                    $gazeboNames[normalizeGazeboName($m[1])] = true;
                }
            }
        }

        $gazeboIdByName = [];
        foreach (array_keys($gazeboNames) as $name) {
            $existing = DB::table('gazebos')->where('name', $name)->first();
            if ($existing) {
                $gazeboIdByName[$name] = $existing->id;

                continue;
            }
            $facilityId = DB::table('facilities')->where('type', 'gazebo')->where('name', $name)->value('id');
            $gid = (string) Str::uuid();
            DB::table('gazebos')->insert([
                'id' => $gid,
                'name' => $name,
                'facility_id' => $facilityId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $gazeboIdByName[$name] = $gid;
        }

        // ── 3. q_r_codes.gazebo_id ─────────────────────────────────────────
        if (Schema::hasTable('q_r_codes') && ! Schema::hasColumn('q_r_codes', 'gazebo_id')) {
            Schema::table('q_r_codes', function (Blueprint $table) {
                $table->char('gazebo_id', 36)->nullable()->after('location_type');
                $table->foreign('gazebo_id')->references('id')->on('gazebos')->nullOnDelete();
            });
        }

        // Backfill q_r_codes.gazebo_id from label prefix
        if (Schema::hasColumn('q_r_codes', 'gazebo_id')) {
            foreach (DB::table('q_r_codes')->where('location_type', 'table')->get() as $qr) {
                $gid = null;
                if (preg_match('/^(.+?)\s+Meja/i', $qr->label, $m)) {
                    $gid = $gazeboIdByName[normalizeGazeboName($m[1])] ?? null;
                } elseif (preg_match('/^(Pondo)\s*\d+/i', $qr->label, $m)) {
                    $gid = $gazeboIdByName[normalizeGazeboName($m[1])] ?? null;
                }
                if ($gid) {
                    DB::table('q_r_codes')->where('id', $qr->id)->update(['gazebo_id' => $gid]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('q_r_codes', 'gazebo_id')) {
            Schema::table('q_r_codes', function (Blueprint $table) {
                $table->dropForeign(['gazebo_id']);
                $table->dropColumn('gazebo_id');
            });
        }
        if (Schema::hasColumn('inventory_transactions', 'total_cost')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                $table->dropColumn('total_cost');
            });
        }
        // Note: we intentionally keep the gazebos table on rollback-safe path.
    }
};
