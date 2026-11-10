<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Komprehensif</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; }
        .header { background: #15803d; color: white; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
        .header h1 { font-size: 20px; font-weight: bold; margin: 0; }
        .header p { font-size: 11px; opacity: 0.85; margin-top: 4px; margin-bottom: 0; }
        
        .section-title { background: #f3f4f6; color: #1f2937; padding: 10px; margin-top: 30px; margin-bottom: 10px; font-size: 16px; border-left: 4px solid #15803d; font-weight: bold; }
        
        .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 10px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #15803d; color: white; padding: 10px; text-align: left; font-size: 10px; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        tr:nth-child(even) td { background: #f9fafb; }
        
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; display: inline-block; }
        .badge-income { background: #dcfce7; color: #166534; }
        .badge-expense { background: #fee2e2; color: #991b1b; }
        .badge-in { background: #dcfce7; color: #166534; }
        .badge-out { background: #fee2e2; color: #991b1b; }
        .badge-adj { background: #fef3c7; color: #92400e; }
        
        .text-emerald { color: #15803d; }
        .text-rose { color: #be123c; }
        
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        
        .page-break { page-break-before: always; }
        
        .summary-box { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
        .summary-box h3 { margin-top: 0; color: #15803d; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        
        .daily-header { color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 4px; margin-top: 20px; font-size: 13px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Komprehensif Resort</h1>
        <p>Periode: {{ $periodFrom }} s/d {{ $periodTo }} | Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="summary-box">
        <h3>Ringkasan Eksekutif (Executive Summary)</h3>
        <table style="margin-bottom: 0;">
            <tr>
                <td style="border: none; width: 50%; vertical-align: top;">
                    <strong>Kinerja Keuangan:</strong><br>
                    Total Pemasukan: <span class="text-emerald">Rp {{ number_format($income, 0, ',', '.') }}</span><br>
                    Total Pengeluaran: <span class="text-rose">Rp {{ number_format($expense, 0, ',', '.') }}</span><br>
                    @if(isset($totalFees) && $totalFees > 0)
                        Potongan Merchant: <span class="text-rose">Rp {{ number_format($totalFees, 0, ',', '.') }}</span><br>
                    @endif
                    Laba Bersih (Net Profit): <strong>Rp {{ number_format($income - $expense - ($totalFees ?? 0), 0, ',', '.') }}</strong>
                </td>
                <td style="border: none; width: 50%; vertical-align: top;">
                    <strong>Kinerja Operasional:</strong><br>
                    Reservasi Aktif: {{ $resTotalActive }} | Tamu: {{ $resTotalGuests }} orang<br>
                    Penjualan Kafe: {{ $cafeTotalOrders }} pesanan | {{ $cafeTotalItems }} item terjual<br>
                    Pergerakan Inventori: {{ $invTotalIn }} masuk | {{ $invTotalOut }} keluar
                </td>
            </tr>
        </table>
    </div>

    <!-- 1. KEUANGAN -->
    <div class="section-title">1. BUKU BESAR (KEUANGAN & ARUS KAS)</div>
    @if($txsByDate->isEmpty())
        <div style="text-align: center; padding: 20px; color: #9ca3af;">Tidak ada transaksi keuangan pada periode ini.</div>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Kategori</th>
                    <th style="width: 40%">Deskripsi Transaksi</th>
                    <th style="width: 25%">Tipe</th>
                    <th style="width: 20%; text-align: right">Nominal (Rp)</th>
                </tr>
            </thead>
            <tbody>
            @foreach($txsByDate as $date => $dayTxs)
                <tr style="background-color: #e5e7eb;">
                    <td colspan="4" style="font-size: 11px; font-weight: bold; color: #15803d; padding: 6px 10px;">
                        {{ $date }}
                        <span style="float: right; font-weight: normal; color: #4b5563;">
                            Pemasukan: <span class="text-emerald">+Rp {{ number_format($dayTxs->where('type', 'income')->sum('amount'), 0, ',', '.') }}</span> | 
                            Pengeluaran: <span class="text-rose">-Rp {{ number_format($dayTxs->where('type', 'expense')->sum('amount'), 0, ',', '.') }}</span>
                        </span>
                    </td>
                </tr>
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
            @endforeach
            </tbody>
        </table>
    @endif

    <div class="page-break"></div>

    <!-- 2. KAFE -->
    <div class="section-title">2. PENJUALAN KAFE (F&B)</div>
    @if($ordersByDate->isEmpty())
        <div style="text-align: center; padding: 20px; color: #9ca3af;">Tidak ada transaksi kafe pada periode ini.</div>
    @else
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
            @foreach($ordersByDate as $date => $dayOrders)
                <tr style="background-color: #e5e7eb;">
                    <td colspan="4" style="font-size: 11px; font-weight: bold; color: #15803d; padding: 6px 10px;">
                        {{ $date }} 
                        <span style="float: right; font-weight: normal; color: #4b5563;">
                            {{ $dayOrders->count() }} pesanan | Pendapatan: Rp {{ number_format($dayOrders->sum('total_amount'), 0, ',', '.') }}
                        </span>
                    </td>
                </tr>
                @foreach($dayOrders as $order)
                <tr>
                    <td>
                        <strong>{{ $order->created_at->format('H:i') }}</strong><br>
                        {{ $order->user ? $order->user->name : $order->guest_name }}
                    </td>
                    <td>
                        <span style="font-size: 9px; font-weight: bold; background: #e5e7eb; padding: 3px 6px; border-radius: 4px;">{{ str_replace('_', ' ', strtoupper($order->order_type)) }}</span>
                    </td>
                    <td>
                        <table style="margin-bottom: 0; width: 100%;">
                            @foreach($order->items as $item)
                            <tr>
                                <td style="border: none; padding: 2px 0; background: transparent;">- {{ $item->menuItem->name ?? 'Item Dihapus' }}</td>
                                <td style="border: none; padding: 2px 0; text-align: center; background: transparent;">{{ $item->quantity }}x</td>
                                <td style="border: none; padding: 2px 0; text-align: right; color: #6b7280; background: transparent;">&#64; Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                            </tr>
                            @endforeach
                        </table>
                    </td>
                    <td style="text-align:right; font-weight: bold; vertical-align: bottom;">
                        {{ number_format($order->total_amount, 0, ',', '.') }}
                    </td>
                </tr>
                @endforeach
            @endforeach
            </tbody>
        </table>
    @endif

    <div class="page-break"></div>

    <!-- 3. RESERVASI -->
    <div class="section-title">3. RESERVASI RESORT</div>
    @if($resByDate->isEmpty())
        <div style="text-align: center; padding: 20px; color: #9ca3af;">Tidak ada reservasi untuk periode ini.</div>
    @else
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
            @foreach($resByDate as $date => $dayRes)
                <tr style="background-color: #e5e7eb;">
                    <td colspan="5" style="font-size: 11px; font-weight: bold; color: #15803d; padding: 6px 10px;">
                        Check-in: {{ $date }}
                        <span style="float: right; font-weight: normal; color: #4b5563;">
                            {{ $dayRes->count() }} reservasi | Pendapatan: Rp {{ number_format($dayRes->where('payment_status', 'paid')->sum('total_amount'), 0, ',', '.') }}
                        </span>
                    </td>
                </tr>
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
                        <span style="font-size: 9px; font-weight: bold; background: #e5e7eb; padding: 3px 6px; border-radius: 4px;">{{ ucfirst($res->status) }}</span><br>
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
            @endforeach
            </tbody>
        </table>
    @endif

    <div class="page-break"></div>

    <!-- 4. INVENTORI -->
    <div class="section-title">4. PERGERAKAN STOK INVENTORI</div>
    @if($invTxsByDate->isEmpty())
        <div style="text-align: center; padding: 20px; color: #9ca3af;">Tidak ada transaksi inventori pada periode ini.</div>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">Waktu</th>
                    <th style="width: 25%">Bahan Baku</th>
                    <th style="width: 10%">Tipe</th>
                    <th style="width: 15%">Mutasi</th>
                    <th style="width: 15%">Stok Akhir</th>
                    <th style="width: 20%; text-align: right">Biaya (Rp)</th>
                </tr>
            </thead>
            <tbody>
            @foreach($invTxsByDate as $date => $dayTxs)
                <tr style="background-color: #e5e7eb;">
                    <td colspan="6" style="font-size: 11px; font-weight: bold; color: #15803d; padding: 6px 10px;">
                        {{ $date }}
                        <span style="float: right; font-weight: normal; color: #4b5563;">
                            {{ $dayTxs->count() }} transaksi | Biaya Restock: Rp {{ number_format($dayTxs->where('type', 'in')->sum('total_cost'), 0, ',', '.') }}
                        </span>
                    </td>
                </tr>
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
            @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        Mega Report ini digenerate secara otomatis oleh Sistem Informasi  Resort
    </div>
</body>
</html>
