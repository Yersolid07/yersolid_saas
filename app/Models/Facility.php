<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Facility extends Model
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
        'name',
        'type',
        'description',
        'capacity',
        'price_per_day',
        'price_per_hour',
        'image_url',
        'is_active',
        'discount_type',
        'discount_value',
        'promo_start',
        'promo_end',
        'promo_name',
        'price_prefix',
        'price_unit',
        'bed_count',
        'amenities',
        'rules',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price_per_day' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'promo_start' => 'datetime',
        'promo_end' => 'datetime',
        'price_per_hour' => 'decimal:2',
        'capacity' => 'integer',
        'bed_count' => 'integer',
        'amenities' => 'array',
        'rules' => 'array',
    ];

    protected $appends = ['final_price'];

    public function getFinalPriceAttribute()
    {
        $now = now();
        // Use whichever price is the primary one for this facility
        $basePrice = $this->price_per_day > 0 ? $this->price_per_day : ($this->price_per_hour ?? 0);

        if ($this->promo_start && $this->promo_end && $now->between($this->promo_start, $this->promo_end)) {
            if ($this->discount_type === 'percentage') {
                return $basePrice - ($basePrice * ($this->discount_value / 100));
            } elseif ($this->discount_type === 'nominal') {
                return max(0, $basePrice - $this->discount_value);
            }
        }

        return $basePrice;
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasManyThrough(Review::class, Reservation::class);
    }

    /**
     * Check if facility is available for the given date range.
     */
    public function isAvailable(string $checkIn, string $checkOut, ?string $checkInTime = null, ?string $checkOutTime = null, ?string $excludeReservationId = null): bool
    {
        $query = $this->reservations()
            ->whereNotIn('status', ['cancelled'])
            ->where(function ($q) use ($checkIn, $checkOut, $checkInTime, $checkOutTime) {
                if ($checkInTime && strlen($checkInTime) === 5) {
                    $checkInTime .= ':00';
                }
                if ($checkOutTime && strlen($checkOutTime) === 5) {
                    $checkOutTime .= ':00';
                }

                if ($checkInTime && $checkOutTime) {
                    $q->whereDate('check_in_date', '<=', $checkOut)
                        ->whereDate('check_out_date', '>=', $checkIn)
                        ->where(function ($timeQ) use ($checkInTime, $checkOutTime) {
                            $timeQ->where('check_in_time', '<', $checkOutTime)
                                ->where('check_out_time', '>', $checkInTime)
                                ->orWhereNull('check_in_time');
                        });
                } else {
                    $q->whereDate('check_in_date', '<', $checkOut)
                        ->whereDate('check_out_date', '>', $checkIn);

                    if ($checkIn === $checkOut) {
                        $q->orWhere(function ($sq) use ($checkIn) {
                            $sq->whereDate('check_in_date', $checkIn)
                                ->whereDate('check_out_date', $checkIn);
                        });
                    }
                }
            });

        // dump($query->toSql(), $query->getBindings());

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        return $query->count() === 0;
    }

    /**
     * Get image URL or default placeholder.
     */
    public function getImageAttribute(): string
    {
        if ($this->image_url && str_starts_with($this->image_url, 'http')) {
            return $this->image_url;
        }

        return $this->image_url
            ? asset('storage/'.$this->image_url)
            : asset('images/facility-placeholder.jpg');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
