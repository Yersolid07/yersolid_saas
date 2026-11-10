<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FeedbackRequestNotification extends Notification implements ShouldQueue
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
            ->subject('Bagaimana Pengalaman Menginap Anda di?')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line('Terima kasih telah memilih sebagai tempat liburan Anda.')
            ->line('Kami harap Anda menikmati fasilitas '.$this->reservation->facility->name.' yang telah Anda pesan.')
            ->line('Kenyamanan Anda adalah prioritas kami. Kami sangat menghargai jika Anda meluangkan waktu 1 menit untuk memberikan ulasan (review) atas pengalaman Anda.')
            ->action('Berikan Ulasan', route('customer.reservations.show', $this->reservation->id).'#review')
            ->line('Masukan Anda sangat berarti bagi peningkatan layanan kami. Sampai jumpa kembali!');
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
