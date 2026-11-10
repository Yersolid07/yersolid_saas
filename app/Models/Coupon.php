<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_purchase',
        'max_uses',
        'used_count',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function isValid($totalAmount = 0)
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->valid_until && $this->valid_until->isPast()) {
            return false;
        }
        if ($this->max_uses && $this->used_count >= $this->max_uses) {
            return false;
        }
        if ($this->min_purchase > 0 && $totalAmount < $this->min_purchase) {
            return false;
        }

        return true;
    }

    public function calculateDiscount($totalAmount)
    {
        if ($this->type === 'percent') {
            return ($totalAmount * $this->value) / 100;
        }

        return min($totalAmount, $this->value); // Discount can't exceed total amount
    }
}
