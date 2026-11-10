<x-mail::message>
# Halo, {{ $order->user ? $order->user->name : $order->guest_name }}!

Terima kasih telah memesan makanan di ****.
Berikut adalah detail pesanan Anda:

- **Kode Pesanan**: {{ $order->unique_code }}
- **Tipe Pesanan**: {{ str_replace('_', ' ', Str::title($order->order_type)) }}
- **Total Tagihan**: Rp {{ number_format($order->total_amount, 0, ',', '.') }}
- **Status Pembayaran**: {{ ucfirst($order->payment_status) }}

**Daftar Pesanan:**
@foreach($order->items as $item)
- {{ $item->menuItem->name }} ({{ $item->quantity }}x) - Rp {{ number_format($item->price * $item->quantity, 0, ',', '.') }}
@endforeach

<x-mail::panel>
Pesanan Anda saat ini sedang diproses oleh tim kami. Jika Anda makan di tempat atau memesan layanan antar ke fasilitas, mohon tunggu dengan santai.
</x-mail::panel>

<x-mail::button :url="route('customer.orders.show', $order->id)">
Lacak Pesanan Anda
</x-mail::button>

Terima kasih, <br>
****
</x-mail::message>
