<?php

namespace App\Notifications;

use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationInvoiceNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $reservation;

    /**
     * Create a new notification instance.
     */
    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Invoice Reservasi ['.$this->reservation->unique_code.']')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line('Terima kasih telah melakukan reservasi untuk '.$this->reservation->facility->name.'.')
            ->line('Status pesanan Anda saat ini adalah: MENUNGGU PEMBAYARAN.')
            ->line('Total Tagihan: Rp '.number_format($this->reservation->total_amount, 0, ',', '.'))
            ->line('Tanggal Check-In: '.Carbon::parse($this->reservation->check_in_date)->format('d M Y'))
            ->line('Segera selesaikan pembayaran Anda agar reservasi tidak kedaluwarsa.')
            ->action('Bayar Sekarang', route('customer.reservations.show', $this->reservation->id))
            ->line('Terima kasih atas kepercayaan Anda memilih!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
