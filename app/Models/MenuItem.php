<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class MenuItem extends Model
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
        'name',
        'description',
        'category',
        'barcode',
        'price',
        'cost_price',
        'image_url',
        'daily_stock',
        'current_stock',
        'is_available',
        'discount_type',
        'discount_value',
        'promo_start',
        'promo_end',
        'promo_name',
        'is_counter_pickup',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'is_available' => 'boolean',
        'promo_start' => 'datetime',
        'promo_end' => 'datetime',
        'is_counter_pickup' => 'boolean',
    ];

    protected $appends = ['final_price', 'is_out_of_stock'];

    public function getIsOutOfStockAttribute(): bool
    {
        return ! $this->is_available || ($this->current_stock !== null && $this->current_stock <= 0);
    }

    public function getFinalPriceAttribute()
    {
        $now = now();
        $basePrice = $this->price;

        if ($this->promo_start && $this->promo_end && $now->between($this->promo_start, $this->promo_end)) {
            if ($this->discount_type === 'percentage') {
                return $basePrice - ($basePrice * ($this->discount_value / 100));
            } elseif ($this->discount_type === 'nominal') {
                return max(0, $basePrice - $this->discount_value);
            }
        }

        return $basePrice;
    }

    public function getImageAttribute(): string
    {
        if ($this->image_url && str_starts_with($this->image_url, 'http')) {
            return $this->image_url;
        }

        return $this->image_url
            ? asset('storage/'.$this->image_url)
            : asset('images/menu-placeholder.jpg');
    }

    /**
     * Scope for items that are available to order.
     * - Must be marked as available (is_available = true)
     * - If stock tracking is enabled (current_stock IS NOT NULL), current_stock must be > 0
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)
            ->where(function ($q) {
                // Items with no stock tracking are always available
                $q->whereNull('current_stock')
                  // Items with stock tracking must have stock remaining
                    ->orWhere(function ($q2) {
                        $q2->whereNotNull('current_stock')
                            ->where('current_stock', '>', 0);
                    });
            });
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
