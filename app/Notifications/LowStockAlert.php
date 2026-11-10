<?php

namespace App\Notifications;

use App\Models\Inventory;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockAlert extends Notification
{
    use Queueable;

    public function __construct(public Inventory $inventory)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'low_stock',
            'inventory_id' => $this->inventory->id,
            'name' => $this->inventory->name,
            'current_stock' => $this->inventory->current_stock,
            'minimum_stock' => $this->inventory->minimum_stock,
            'unit' => $this->inventory->unit,
            'message' => "Stok {$this->inventory->name} tipis: tinggal {$this->inventory->current_stock} {$this->inventory->unit} (batas aman {$this->inventory->minimum_stock}). Segera restock.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("⚠ Stok Tipis: {$this->inventory->name}")
            ->line("Stok {$this->inventory->name} tinggal {$this->inventory->current_stock} {$this->inventory->unit}.")
            ->line("Batas aman: {$this->inventory->minimum_stock} {$this->inventory->unit}.")
            ->action('Cek Gudang', url('/admin/inventories'));
    }
}
