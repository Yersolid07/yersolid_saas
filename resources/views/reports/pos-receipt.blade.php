<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk POS - #ORD-{{ strtoupper(substr($order->id, 0, 5)) }}</title>
    <style>
        @page { size: 58mm auto; margin: 0; }
        body {
            font-family: 'Courier New', Courier, monospace;
            width: 58mm; /* Thermal printers standard 58mm */
            margin: 0 auto;
            padding: 5px;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        
        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
        .header p { margin: 2px 0; font-size: 10px; }
        
        .meta-data { margin-bottom: 10px; font-size: 11px; }
        .meta-data table { width: 100%; }
        
        .items table { width: 100%; border-collapse: collapse; }
        .items th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; }
        .items td { padding: 4px 0; vertical-align: top; }
        
        .item-name { max-width: 130px; word-wrap: break-word; }
        .item-qty { width: 30px; text-align: center; }
        .item-price { text-align: right; }
        .item-total { text-align: right; font-weight: bold; }
        
        .item-notes { font-size: 10px; font-style: italic; display: block; margin-top: 2px; }

        .totals { margin-top: 10px; }
        .totals table { width: 100%; }
        .totals td { padding: 2px 0; }
        
        .grand-total { font-size: 14px; font-weight: bold; }
        
        .footer { margin-top: 15px; font-size: 10px; }
        
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body onload="window.print();">

    <div class="header text-center">
        <h1>{{ $company['name'] ?? 'My Business' }}</h1>
        <p>{{ $company['name'] ?? 'My Business' }}</p>
        <p>{{ $company['address'] ?? 'Your address here' }}</p>
    </div>

    <div class="divider"></div>

    <div class="meta-data">
        <table>
            <tr>
                <td>Tgl: {{ $order->created_at->format('d/m/Y H:i') }}</td>
                <td class="text-right">Kasir: {{ $order->user ? explode(' ', $order->user->name)[0] : 'System' }}</td>
            </tr>
            <tr>
                <td>ID : #ORD-{{ strtoupper(substr($order->id, 0, 5)) }}</td>
                <td class="text-right">Tipe : {{ strtoupper(str_replace('_', ' ', $order->order_type)) }}</td>
            </tr>
            <tr>
                <td colspan="2">
                    Tamu: {{ $order->guest_name ?? 'Walk-in' }}
                    @if($order->order_type === 'dine_in' && $order->table_number)
                        | Meja: {{ $order->table_number }}
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="divider"></div>

    <div class="items">
        <table>
            <tr>
                <th>Menu</th>
                <th class="item-qty">Qty</th>
                <th class="item-total">Total</th>
            </tr>
            @foreach($order->items as $item)
            <tr>
                <td class="item-name">
                    {{ $item->menuItem->name }}
                    @if($item->notes)
                        <span class="item-notes">*{{ $item->notes }}</span>
                    @endif
                </td>
                <td class="item-qty">{{ $item->quantity }}</td>
                <td class="item-total">{{ number_format($item->quantity * $item->price, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </table>
    </div>

    <div class="divider"></div>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td class="text-right">{{ number_format($order->total_amount, 0, ',', '.') }}</td>
            </tr>
            @if(request('change_amount') !== null)
            <tr>
                <td>Tunai</td>
                <td class="text-right">{{ number_format($order->total_amount + request('change_amount', 0), 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Kembali</td>
                <td class="text-right">{{ number_format(request('change_amount', 0), 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr>
                <td colspan="2" class="divider"></td>
            </tr>
            <tr class="grand-total">
                <td>TOTAL</td>
                <td class="text-right">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Status Bayar</td>
                <td class="text-right">{{ $order->payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS' }}</td>
            </tr>
        </table>
    </div>

    <div class="divider"></div>

    <div class="footer text-center">
        <p>Terima Kasih Atas Kunjungan Anda!</p>
        <p>Silakan tinggalkan ulasan di website kami.</p>
    </div>

</body>
</html>
