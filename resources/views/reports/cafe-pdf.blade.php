<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Cafe</title>
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
        .badge-preparing { background: #dbeafe; color: #1e40af; }
        .badge-ready { background: #fef08a; color: #854d0e; }
        .badge-delivered { background: #dcfce7; color: #166534; }
        .badge-completed { background: #dcfce7; color: #166534; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        .item-list { font-size: 9px; color: #4b5563; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Pemesanan Cafe Resort</h1>
        <p>Periode: {{ $periodFrom }} s/d {{ $periodTo }} | Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="meta">
        <span>Total Pesanan: <strong>{{ $totalOrders }}</strong></span>
        <span>Total Item Terjual: <strong>{{ $totalItems }} porsi</strong></span>
        <span>Total Pendapatan: <strong>Rp {{ number_format($revenue, 0, ',', '.') }}</strong></span>
    </div>

    @forelse($ordersByDate as $date => $dayOrders)
        <h3 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 4px; margin-top: 20px; font-size: 14px;">
            {{ $date }} 
            <span style="float: right; font-size: 11px; font-weight: normal; color: #4b5563;">
                {{ $dayOrders->count() }} pesanan | Pendapatan: Rp {{ number_format($dayOrders->sum('total_amount'), 0, ',', '.') }}
            </span>
        </h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Waktu & Pemesan</th>
                    <th style="width: 15%">Tipe Pesanan</th>
                    <th style="width: 50%">Rincian Item yang Dibeli</th>
                    <th style="width: 20%; text-align: right">Total (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dayOrders as $order)
                <tr>
                    <td>
                        <strong>{{ $order->created_at->format('H:i') }}</strong><br>
                        {{ $order->user ? $order->user->name : $order->guest_name }}
                    </td>
                    <td>
                        <span class="badge badge-completed">{{ str_replace('_', ' ', strtoupper($order->order_type)) }}</span>
                    </td>
                    <td>
                        <table style="margin-bottom: 0; width: 100%;">
                            @foreach($order->items as $item)
                            <tr>
                                <td style="border: none; padding: 2px 0;">- {{ $item->menuItem->name ?? 'Item Dihapus' }}</td>
                                <td style="border: none; padding: 2px 0; text-align: center;">{{ $item->quantity }}x</td>
                                <td style="border: none; padding: 2px 0; text-align: right; color: #6b7280;">&#64; Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                            </tr>
                            @endforeach
                        </table>
                    </td>
                    <td style="text-align:right; font-weight: bold; vertical-align: bottom;">
                        {{ number_format($order->total_amount, 0, ',', '.') }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @empty
        <div style="text-align: center; padding: 40px; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 8px;">
            Tidak ada transaksi kafe pada periode ini.
        </div>
    @endforelse

    <div class="footer">
        Laporan ini digenerate secara otomatis oleh Sistem Informasi  Resort
    </div>
</body>
</html>
