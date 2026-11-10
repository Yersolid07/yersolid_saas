<?php

namespace App\Models;

use App\Mail\OrderSuccessMail;
use App\Mail\ReservationSuccessMail;
use App\Notifications\NewFoodOrder;
use App\Services\PaymentService;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

class Payment extends Model
{
    use HasUuids;

    protected $fillable = [
        'reservation_id',
        'food_order_id',
        'amount',
        'fee_merchant',
        'fee_customer',
        'payment_method',
        'payment_type',
        'payment_status',
        'transaction_id',
        'payment_reference',
        'proof_image',
        'gateway_response',
        'payment_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'payment_date' => 'datetime',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function foodOrder(): BelongsTo
    {
        return $this->belongsTo(FoodOrder::class);
    }

    public function getProofImageUrlAttribute(): ?string
    {
        return $this->proof_image ? asset('storage/'.$this->proof_image) : null;
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('payment_status', $status);
    }

    public function markAsSuccess(?string $transactionId = null): void
    {
        if ($this->payment_status === 'success') {
            return;
        }

        $this->update([
            'payment_status' => 'success',
            'transaction_id' => $transactionId ?? $this->transaction_id,
            'payment_date' => now(),
        ]);

        // Update related reservation/order payment status
        if ($this->reservation) {
            // #4 — DP vs pelunasan:
            //  - payment_type 'dp'/'deposit'/'booking' pada preferensi dp => 'dp_paid'
            //  - hanya 'pelunasan' (atau lunas penuh) yang menandai 'paid'
            $isDpPayment = in_array($this->payment_type, ['dp', 'deposit'], true)
                || ($this->payment_type === 'booking' && $this->reservation->payment_preference === 'dp');

            $this->reservation->update([
                'payment_status' => $isDpPayment ? 'dp_paid' : 'paid',
                'status' => 'confirmed',
            ]);

            if ($isDpPayment) {
                $this->reservation->update([
                    'dp_amount' => $this->amount,
                    'dp_paid_at' => now(),
                ]);
            }

            $email = $this->reservation->user?->email ?? $this->reservation->customer_email;
            if ($email) {
                try {
                    Mail::to($email)->send(new ReservationSuccessMail($this->reservation));
                } catch (\Exception $e) {
                    Log::error('[Payment] Failed to send reservation email', ['error' => $e->getMessage()]);
                }
            }
        }

        if ($this->foodOrder) {
            $this->foodOrder->update([
                'payment_status' => 'paid',
            ]);

            // Fresh-load items with menuItem to avoid stale relation cache
            $foodOrder = $this->foodOrder->fresh(['items.menuItem']);

            // #3 GERBANG KASIR: pesanan ONLINE (status 'awaiting_cashier') TIDAK
            // boleh langsung masuk dapur. Kasir harus ACC lewat POS dulu.
            // Pembayaran lunas hanya mengubah payment_status; status tetap
            // 'awaiting_cashier' sampai StaffFoodOrderController@approve dipanggil.
            if ($foodOrder->status === 'awaiting_cashier') {
                // Notifikasi ke kasir/staff — bukan ke dapur.
                $cashiers = User::role(['staff', 'manager', 'admin'])->get();
                if ($cashiers->isNotEmpty()) {
                    Notification::send($cashiers, new NewFoodOrder($foodOrder));
                }

                try {
                    PaymentService::recordIncome($this);
                } catch (\Exception $e) {
                    Log::error('[Payment] Failed to record financial transaction', ['error' => $e->getMessage()]);
                }

                return;
            }

            // Check if there are food items to notify kitchen
            $hasFood = $foodOrder->items->contains(
                fn ($i) => $i->menuItem && in_array($i->menuItem->category, ['makanan', 'minuman', 'snack', 'dessert'])
            );

            if ($hasFood) {
                $kitchenStaff = User::role(['staff', 'manager', 'admin'])->get();
                Notification::send($kitchenStaff, new NewFoodOrder($foodOrder));
            } else {
                if ($foodOrder->status === 'pending') {
                    $foodOrder->update(['status' => 'delivered']);
                }
            }

            if ($foodOrder->user?->email) {
                try {
                    Mail::to($foodOrder->user->email)
                        ->send(new OrderSuccessMail($foodOrder));
                } catch (\Exception $e) {
                    Log::error('[Payment] Failed to send food order email', ['error' => $e->getMessage()]);
                }
            }
        }

        // Auto-record income in financial transactions
        try {
            PaymentService::recordIncome($this);
        } catch (\Exception $e) {
            Log::error('[Payment] Failed to record financial transaction', ['error' => $e->getMessage()]);
        }
    }

    public function markAsFailed(array $gatewayResponse = []): void
    {
        if (in_array($this->payment_status, ['success', 'failed'])) {
            return;
        }

        $this->update([
            'payment_status' => 'failed',
            'gateway_response' => $gatewayResponse,
        ]);

        if ($this->reservation && $this->reservation->payment_status !== 'paid') {
            $this->reservation->update([
                'status' => 'cancelled',
            ]);

            // Cancel associated food orders (room service) and restore stock
            // Eager load to avoid N+1
            $this->reservation->load('foodOrders.items.menuItem');
            foreach ($this->reservation->foodOrders as $foodOrder) {
                if ($foodOrder->status !== 'cancelled' && $foodOrder->payment_status !== 'paid') {
                    $foodOrder->update([
                        'status' => 'cancelled',
                    ]);

                    foreach ($foodOrder->items as $item) {
                        if ($item->menuItem && $item->menuItem->current_stock !== null) {
                            $item->menuItem->increment('current_stock', $item->quantity);
                            $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                        }
                    }
                }
            }
        }

        if ($this->foodOrder && $this->foodOrder->payment_status !== 'paid') {
            $this->foodOrder->update([
                'status' => 'cancelled',
            ]);

            // Restore menu items stock — eager load to avoid N+1
            $this->foodOrder->load('items.menuItem');
            foreach ($this->foodOrder->items as $item) {
                if ($item->menuItem && $item->menuItem->current_stock !== null) {
                    $item->menuItem->increment('current_stock', $item->quantity);
                    $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                }
            }
        }
    }
}
