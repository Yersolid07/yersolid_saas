<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; }
        .header { background: #15803d; color: white; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
        .header h1 { font-size: 20px; font-weight: bold; margin: 0; }
        .header p { font-size: 11px; opacity: 0.85; margin-top: 4px; margin-bottom: 0; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 10px; color: #6b7280; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
        .summary-card .value { font-size: 16px; font-weight: bold; color: #15803d; }
        .summary-card .label { font-size: 10px; color: #6b7280; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #15803d; color: white; padding: 10px; text-align: left; font-size: 10px; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; display: inline-block; }
        .badge-income { background: #dcfce7; color: #166534; }
        .badge-expense { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        .text-emerald { color: #15803d; }
        .text-rose { color: #be123c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Keuangan (Accounting) Resort</h1>
        <p>Periode: {{ $period_from }} s/d {{ $period_to }} | Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="meta">
        <span>Total Pemasukan: <strong class="text-emerald">Rp {{ number_format($income, 0, ',', '.') }}</strong></span>
        <span>Total Pengeluaran: <strong class="text-rose">Rp {{ number_format($expense, 0, ',', '.') }}</strong></span>
        <span>Laba Bersih (Net): <strong>Rp {{ number_format($income - $expense, 0, ',', '.') }}</strong></span>
    </div>

    @forelse($txsByDate as $date => $dayTxs)
        <h3 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 4px; margin-top: 20px; font-size: 14px;">
            {{ $date }}
            <span style="float: right; font-size: 11px; font-weight: normal; color: #4b5563;">
                Pemasukan: <span class="text-emerald">+Rp {{ number_format($dayTxs->where('type', 'income')->sum('amount'), 0, ',', '.') }}</span> | 
                Pengeluaran: <span class="text-rose">-Rp {{ number_format($dayTxs->where('type', 'expense')->sum('amount'), 0, ',', '.') }}</span>
            </span>
        </h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Kategori</th>
                    <th style="width: 40%">Deskripsi Transaksi</th>
                    <th style="width: 25%">Tipe (Arus Kas)</th>
                    <th style="width: 20%; text-align: right">Nominal (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dayTxs as $trx)
                <tr>
                    <td>
                        <strong>{{ strtoupper($trx->category) }}</strong><br>
                        <span style="font-size: 9px; color: #6b7280;">{{ $trx->user->name ?? 'Sistem' }}</span>
                    </td>
                    <td>{{ $trx->description }}</td>
                    <td>
                        @if($trx->type == 'income')
                            <span class="badge badge-income">Pemasukan</span>
                        @else
                            <span class="badge badge-expense">Pengeluaran</span>
                        @endif
                    </td>
                    <td style="text-align:right; font-weight: bold;">
                        @if($trx->type == 'income')
                            <span class="text-emerald">+{{ number_format($trx->amount, 0, ',', '.') }}</span>
                        @else
                            <span class="text-rose">-{{ number_format($trx->amount, 0, ',', '.') }}</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @empty
        <div style="text-align: center; padding: 40px; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 8px;">
            Tidak ada pencatatan transaksi keuangan pada periode ini.
        </div>
    @endforelse

    <div class="footer">
        Laporan ini digenerate secara otomatis oleh Sistem Informasi  Resort
    </div>
</body>
</html>
