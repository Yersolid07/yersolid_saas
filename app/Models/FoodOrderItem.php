<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodOrderItem extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $table = 'food_order_items';

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'quantity',
        'price',
        'notes',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'status' => 'string',
        'created_at' => 'datetime',
    ];

    protected $with = ['menuItem'];

    const CREATED_AT = 'created_at';

    const UPDATED_AT = null;

    public function order(): BelongsTo
    {
        return $this->belongsTo(FoodOrder::class, 'order_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function getSubtotalAttribute(): float
    {
        return (float) $this->quantity * (float) $this->price;
    }
}
