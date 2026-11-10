<?php

namespace App\Console\Commands;

use App\Services\Bi\BiSnapshotService;
use Illuminate\Console\Command;

class BiSnapshotCommand extends Command
{
    protected $signature = 'bi:snapshot {--days=30 : Jumlah hari ke belakang yang di-generate}';

    protected $description = 'Generate BI daily snapshots untuk rentang hari (deterministik, tanpa LLM)';

    public function handle(BiSnapshotService $service): int
    {
        $days = (int) $this->option('days');
        $from = now()->subDays($days - 1)->startOfDay();
        $count = $service->generateRange($from, now());

        $this->info("BI snapshot generated: {$count} hari.");

        return self::SUCCESS;
    }
}
