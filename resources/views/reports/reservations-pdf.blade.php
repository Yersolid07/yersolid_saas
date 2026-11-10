<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Reservasi</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; }
        .header { background: #15803d; color: white; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
        .header h1 { font-size: 20px; font-weight: bold; margin: 0; }
        .header p { font-size: 11px; opacity: 0.85; margin-top: 4px; margin-bottom: 0; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 10px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #15803d; color: white; padding: 10px; text-align: left; font-size: 10px; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; display: inline-block; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-confirmed { background: #dbeafe; color: #1e40af; }
        .badge-completed { background: #dcfce7; color: #166534; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Reservasi Resort</h1>
        <p>Periode: {{ $period_from }} s/d {{ $period_to }} | Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="meta">
        <span>Reservasi Aktif: <strong>{{ $totalActive }}</strong> | Dibatalkan: <strong>{{ $totalCancelled }}</strong> | Total Tamu: <strong>{{ $totalGuests }} orang</strong></span>
        <span>Total Pendapatan: <strong>Rp {{ number_format($revenue, 0, ',', '.') }}</strong></span>
    </div>

    @forelse($resByDate as $date => $dayRes)
        <h3 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 4px; margin-top: 20px; font-size: 14px;">
            Check-in: {{ $date }}
            <span style="float: right; font-size: 11px; font-weight: normal; color: #4b5563;">
                {{ $dayRes->count() }} reservasi | Pendapatan: Rp {{ number_format($dayRes->where('payment_status', 'paid')->sum('total_amount'), 0, ',', '.') }}
            </span>
        </h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%">Tamu & Kontak</th>
                    <th style="width: 20%">Fasilitas & Tamu</th>
                    <th style="width: 20%">Durasi (Check-out)</th>
                    <th style="width: 15%">Status / Bayar</th>
                    <th style="width: 20%; text-align: right">Total (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dayRes as $res)
                <tr>
                    <td>
                        <strong>{{ $res->user?->name ?? 'Tamu Sistem' }}</strong><br>
                        <span style="font-size: 9px; color: #6b7280;">ID: {{ explode('-', $res->id)[0] }}</span>
                    </td>
                    <td>
                        <strong>{{ $res->facility?->name ?? '-' }}</strong><br>
                        <span style="font-size: 9px; color: #6b7280;">{{ $res->guest_count }} orang dewasa</span>
                    </td>
                    <td>
                        {{ $res->check_out_date?->format('d M Y') }}<br>
                        <span style="font-size: 9px; color: #6b7280;">
                            ({{ Carbon\Carbon::parse($res->check_in_date)->diffInDays(Carbon\Carbon::parse($res->check_out_date)) ?: 1 }} Malam)
                        </span>
                    </td>
                    <td>
                        <span class="badge badge-{{ $res->status }}">{{ ucfirst($res->status) }}</span><br>
                        <span style="font-size: 9px; color: {{ $res->payment_status === 'paid' ? '#166534' : '#991b1b' }}; margin-top: 4px; display: inline-block;">
                            {{ strtoupper($res->payment_status) }}
                        </span>
                    </td>
                    <td style="text-align:right; font-weight: bold; vertical-align: top;">
                        {{ number_format($res->total_amount, 0, ',', '.') }}
                        @if($res->special_requests)
                            <div style="font-size: 8px; font-weight: normal; color: #9ca3af; margin-top: 4px; text-align: right;">
                                Note: {{ Str::limit($res->special_requests, 30) }}
                            </div>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @empty
        <div style="text-align: center; padding: 40px; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 8px;">
            Tidak ada reservasi untuk periode ini.
        </div>
    @endforelse

    <div class="footer">
        Laporan ini digenerate secara otomatis oleh Sistem Informasi  Resort
    </div>
</body>
</html>
