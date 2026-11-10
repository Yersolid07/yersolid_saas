<?php

namespace App\Exports;

use App\Models\Reservation;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReservationsExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private string $dateFrom,
        private string $dateTo
    ) {}

    public function query()
    {
        return Reservation::query()
            ->with(['user', 'facility', 'payment'])
            ->whereBetween('created_at', [$this->dateFrom, $this->dateTo.' 23:59:59'])
            ->orderBy('check_in_date');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Tamu',
            'Email',
            'No. HP',
            'Fasilitas',
            'Tipe',
            'Check-in',
            'Check-out',
            'Jumlah Tamu',
            'Total (Rp)',
            'Status',
            'Status Pembayaran',
            'Tanggal Dibuat',
        ];
    }

    public function map($reservation): array
    {
        return [
            substr($reservation->id, 0, 8),
            $reservation->user?->name,
            $reservation->user?->email,
            $reservation->user?->phone,
            $reservation->facility?->name,
            $reservation->facility?->type,
            $reservation->check_in_date?->format('d/m/Y'),
            $reservation->check_out_date?->format('d/m/Y'),
            $reservation->guest_count,
            number_format($reservation->total_amount, 0, ',', '.'),
            ucfirst($reservation->status),
            ucfirst($reservation->payment_status),
            $reservation->created_at?->format('d/m/Y H:i'),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '16a34a']]],
        ];
    }

    public function title(): string
    {
        return 'Reservasi';
    }
}
