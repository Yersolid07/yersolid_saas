<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Reservation extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'user_id',
        'facility_id',
        'check_in_date',
        'check_out_date',
        'check_in_time',
        'check_out_time',
        'guest_count',
        'total_amount',
        'coupon_code',
        'discount_amount',
        'status',
        'payment_status',
        'payment_preference',
        'guarantee_fee',
        'dp_amount',
        'dp_paid_at',
        'special_requests',
        'unique_code',
        'customer_name',
        'customer_email',
        'customer_phone',
    ];

    protected static function booted(): void
    {
        static::creating(function (Reservation $reservation) {
            if (empty($reservation->unique_code)) {
                // Generate WK-XXXXXX
                $reservation->unique_code = 'WK-'.strtoupper(substr(md5(uniqid()), 0, 6));
            }
        });
    }

    protected $casts = [
        'check_in_date' => 'date',
        'check_out_date' => 'date',
        'total_amount' => 'decimal:2',
        'guest_count' => 'integer',
        'guarantee_fee' => 'decimal:2',
        'dp_amount' => 'decimal:2',
        'dp_paid_at' => 'datetime',
    ];

    /**
     * #4 — SEMUA pembayaran untuk satu reservasi (DP + pelunasan + deposit).
     * Relasi ini query, bukan HasMany Eloquent, supaya 4.826 payment produksi
     * tidak terdampak. `payment()` (HasOne) dipertahankan untuk kompatibilitas
     * view/laporan lama dan tetap berarti "payment terbaru".
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest();
    }

    public function getRemainingAmountAttribute(): float
    {
        $paid = (float) $this->payments()
            ->where('payment_status', 'success')
            ->sum('amount');

        return max(0, (float) $this->total_amount - $paid);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function foodOrders(): HasMany
    {
        return $this->hasMany(FoodOrder::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Duration in nights (for homestay) or hours.
     */
    public function getDurationAttribute(): int
    {
        return $this->check_in_date->diffInDays($this->check_out_date) ?: 1;
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('check_in_date', '>=', now()->toDateString())
            ->whereIn('status', ['pending', 'confirmed']);
    }

    public function scopeToday($query)
    {
        return $query->where('check_in_date', now()->toDateString());
    }

    public function canBeReviewed(): bool
    {
        return $this->status === 'completed' && ! $this->review()->exists();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'confirmed'])
            && $this->check_in_date->isFuture();
    }
}
