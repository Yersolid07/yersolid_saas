<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewReservation extends Notification
{
    use Queueable;

    public $reservation;

    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = $this->reservation->user ? $this->reservation->user->name : ($this->reservation->customer_name ?? 'Tamu');

        return [
            'type' => 'new_reservation',
            'title' => 'Reservasi Baru',
            'message' => 'Reservasi baru dibuat oleh '.$name.' untuk '.$this->reservation->facility->name,
            'url' => route('admin.reservations.show', $this->reservation->id),
            'id' => $this->reservation->id,
        ];
    }
}
