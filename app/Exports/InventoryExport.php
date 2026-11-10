<?php

namespace App\Exports;

use App\Models\InventoryTransaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $periodFrom;

    protected $periodTo;

    public function __construct($periodFrom, $periodTo)
    {
        $this->periodFrom = $periodFrom;
        $this->periodTo = $periodTo;
    }

    public function collection()
    {
        return InventoryTransaction::with(['inventory', 'user'])
            ->whereBetween('created_at', [$this->periodFrom, $this->periodTo.' 23:59:59'])
            ->orderBy('created_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID Transaksi',
            'Tanggal',
            'Nama Item',
            'Tipe',
            'Jumlah',
            'Sisa Stok',
            'Total Nilai (Rp)',
            'Petugas',
        ];
    }

    public function map($transaction): array
    {
        return [
            $transaction->id,
            $transaction->created_at->format('Y-m-d H:i'),
            $transaction->inventory->name ?? 'Unknown',
            strtoupper($transaction->type),
            $transaction->quantity.' '.($transaction->inventory->unit ?? ''),
            $transaction->stock_after.' '.($transaction->inventory->unit ?? ''),
            $transaction->total_cost ?? 0,
            $transaction->user->name ?? 'System',
        ];
    }

    public function title(): string
    {
        return 'Inventori';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '16a34a']]],
        ];
    }
}
