<?php

namespace App\Notifications;

use App\Models\FoodOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FoodOrderStatusUpdated extends Notification
{
    use Queueable;

    public $order;

    public $statusLabel;

    public function __construct(FoodOrder $order, string $statusLabel)
    {
        $this->order = $order;
        $this->statusLabel = $statusLabel;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'food_order_status',
            'title' => 'Status Pesanan Makanan',
            'message' => 'Pesanan makanan Anda sekarang berstatus: '.$this->statusLabel,
            'url' => route('customer.orders.show', $this->order->id),
            'id' => $this->order->id,
        ];
    }
}
