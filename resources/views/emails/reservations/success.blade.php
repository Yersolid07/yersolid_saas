<x-mail::message>
# Halo, {{ $reservation->user ? $reservation->user->name : $reservation->guest_name }}!

Terima kasih telah melakukan reservasi di ****.
Berikut adalah detail reservasi Anda:

- **Kode Reservasi**: {{ $reservation->unique_code }}
- **Fasilitas**: {{ $reservation->facility->name }}
- **Tanggal**: {{ \Carbon\Carbon::parse($reservation->start_time)->format('d F Y') }}
- **Waktu**: {{ \Carbon\Carbon::parse($reservation->start_time)->format('H:i') }} - {{ \Carbon\Carbon::parse($reservation->end_time)->format('H:i') }}
- **Jumlah Tamu**: {{ $reservation->guest_count }} orang
- **Total Harga**: Rp {{ number_format($reservation->total_price, 0, ',', '.') }}

<x-mail::panel>
Silakan tunjukkan kode reservasi ini kepada petugas kami saat Anda tiba di lokasi.
</x-mail::panel>

<x-mail::button :url="route('customer.reservations.show', $reservation->id)">
Lihat Detail Reservasi
</x-mail::button>

Terima kasih, <br>
****
</x-mail::message>
