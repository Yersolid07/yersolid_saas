<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReservationStatusUpdated extends Notification
{
    use Queueable;

    public $reservation;

    public $statusLabel;

    public function __construct(Reservation $reservation, string $statusLabel)
    {
        $this->reservation = $reservation;
        $this->statusLabel = $statusLabel;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'reservation_status',
            'title' => 'Status Reservasi Diperbarui',
            'message' => 'Reservasi Anda ('.$this->reservation->facility->name.') sekarang berstatus: '.$this->statusLabel,
            'url' => route('customer.reservations.show', $this->reservation->id),
            'id' => $this->reservation->id,
        ];
    }
}
