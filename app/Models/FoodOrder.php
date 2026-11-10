<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Models\FinancialTransaction;

class FoodOrder extends Model
{
    use HasUuids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'user_id',
        'reservation_id',
        'total_amount',
        'status',
        'payment_status',
        'order_type',
        'table_number',
        'notes',
        'customer_name',
        'customer_phone',
        'session_id',
        'estimated_ready_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'estimated_ready_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(FoodOrderItem::class, 'order_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function recalculateTotal(): void
    {
        $this->total_amount = $this->items()->sum(DB::raw('quantity * price'));
        $this->save();
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'preparing', 'ready']);
    }

    protected static function booted(): void
    {
        static::deleting(function (FoodOrder $order) {
            // Hapus semua financial transaction yang terkait dengan pesanan cafe ini
            FinancialTransaction::where('category', 'cafe')
                                ->where('reference_id', $order->id)
                                ->delete();
        });
    }}
