<?php

namespace App\Exports;

use App\Models\FoodOrder;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CafeExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
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
        return FoodOrder::with(['user', 'items.menuItem'])
            ->whereBetween('created_at', [$this->periodFrom, $this->periodTo.' 23:59:59'])
            ->whereIn('payment_status', ['paid'])
            ->orderBy('created_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID Pesanan',
            'Tanggal',
            'Nama Pemesan',
            'Tipe',
            'Item & Qty',
            'Total Nominal (Rp)',
        ];
    }

    public function map($order): array
    {
        $items = $order->items->map(function ($item) {
            return ($item->menuItem->name ?? 'Unknown').' (x'.$item->quantity.')';
        })->implode(', ');

        return [
            $order->id,
            $order->created_at->format('Y-m-d H:i'),
            $order->user ? $order->user->name : $order->customer_name,
            $order->order_type,
            $items,
            $order->total_amount,
        ];
    }

    public function title(): string
    {
        return 'Kafe';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '16a34a']]],
        ];
    }
}
