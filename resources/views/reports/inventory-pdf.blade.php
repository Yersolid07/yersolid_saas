<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Inventori</title>
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
        .badge-in { background: #dcfce7; color: #166534; }
        .badge-out { background: #fee2e2; color: #991b1b; }
        .badge-adj { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Transaksi Inventori Resort</h1>
        <p>Periode: {{ $period_from }} s/d {{ $period_to }} | Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="meta">
        <span>Transaksi Masuk: <strong>{{ $totalIn }}</strong> | Transaksi Keluar: <strong>{{ $totalOut }}</strong> | Penyesuaian: <strong>{{ $totalAdj }}</strong></span>
        <span>Total Pengeluaran Restock: <strong>Rp {{ number_format($totalCost, 0, ',', '.') }}</strong></span>
    </div>

    @forelse($txsByDate as $date => $dayTxs)
        <h3 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 4px; margin-top: 20px; font-size: 14px;">
            {{ $date }}
            <span style="float: right; font-size: 11px; font-weight: normal; color: #4b5563;">
                {{ $dayTxs->count() }} transaksi | Restock: Rp {{ number_format($dayTxs->where('type', 'in')->sum('total_cost'), 0, ',', '.') }}
            </span>
        </h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Waktu</th>
                    <th style="width: 25%">Bahan Baku</th>
                    <th style="width: 10%">Tipe</th>
                    <th style="width: 15%">Jumlah</th>
                    <th style="width: 15%">Sisa Stok</th>
                    <th style="width: 20%; text-align: right">Biaya (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dayTxs as $trx)
                <tr>
                    <td>
                        {{ $trx->created_at->format('H:i') }}<br>
                        <span style="font-size: 9px; color: #6b7280;">Oleh: {{ $trx->user->name ?? '-' }}</span>
                    </td>
                    <td><strong>{{ $trx->inventory->name ?? 'Unknown' }}</strong></td>
                    <td>
                        @if($trx->type === 'in')
                            <span class="badge badge-in">Masuk</span>
                        @elseif($trx->type === 'out')
                            <span class="badge badge-out">Keluar</span>
                        @else
                            <span class="badge badge-adj">Adj</span>
                        @endif
                    </td>
                    <td>{{ $trx->type === 'in' ? '+' : ($trx->type === 'out' ? '-' : '') }}{{ $trx->quantity }} {{ $trx->inventory->unit ?? '' }}</td>
                    <td style="font-weight: bold; color: #1e40af;">{{ $trx->stock_after }} {{ $trx->inventory->unit ?? '' }}</td>
                    <td style="text-align:right">
                        {{ $trx->total_cost > 0 ? number_format($trx->total_cost, 0, ',', '.') : '-' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @empty
        <div style="text-align: center; padding: 40px; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 8px;">
            Tidak ada transaksi inventori pada periode ini.
        </div>
    @endforelse

    <div class="footer">
        Laporan ini digenerate secara otomatis oleh Sistem Informasi  Resort
    </div>
</body>
</html>
