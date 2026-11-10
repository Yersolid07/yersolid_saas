<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceiptNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $payment;

    /**
     * Create a new notification instance.
     */
    public function __construct(Payment $payment)
    {
        $this->payment = $payment;
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
        $resName = $this->payment->reservation ? $this->payment->reservation->facility->name : 'Pesanan Makanan';

        return (new MailMessage)
            ->subject('Kwitansi Pembayaran Lunas')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line('Pembayaran Anda untuk '.$resName.' sebesar Rp '.number_format($this->payment->amount, 0, ',', '.').' telah kami terima dengan sukses.')
            ->line('Status transaksi Anda: LUNAS.')
            ->line('Detail Referensi: '.($this->payment->transaction_id ?? $this->payment->id))
            ->line('Silakan simpan email ini sebagai bukti pembayaran yang sah.')
            ->action('Lihat Detail Pembayaran', route('customer.payments.show', $this->payment->id))
            ->line('Terima kasih!');
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
