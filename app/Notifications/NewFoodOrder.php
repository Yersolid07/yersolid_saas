<?php

namespace App\Notifications;

use App\Models\FoodOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewFoodOrder extends Notification
{
    use Queueable;

    public $order;

    public function __construct(FoodOrder $order)
    {
        $this->order = $order;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = $this->order->user ? $this->order->user->name : ($this->order->customer_name ?? 'Tamu');

        return [
            'type' => 'new_food_order',
            'title' => 'Pesanan Makanan Baru',
            'message' => 'Pesanan baru dari '.$name.' ('.str_replace('_', ' ', $this->order->order_type).')',
            'url' => route('staff.food-orders.index'),
            'id' => $this->order->id,
        ];
    }
}
