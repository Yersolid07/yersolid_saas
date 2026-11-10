<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ComprehensiveExport implements WithMultipleSheets
{
    protected $periodFrom;

    protected $periodTo;

    public function __construct($periodFrom, $periodTo)
    {
        $this->periodFrom = $periodFrom;
        $this->periodTo = $periodTo;
    }

    public function sheets(): array
    {
        return [
            new AccountingExport($this->periodFrom, $this->periodTo),
            new CafeExport($this->periodFrom, $this->periodTo),
            new ReservationsExport($this->periodFrom, $this->periodTo),
            new InventoryExport($this->periodFrom, $this->periodTo),
        ];
    }
}
