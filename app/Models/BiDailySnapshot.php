<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiDailySnapshot extends Model
{
    protected $table = 'bi_daily_snapshots';

    protected $primaryKey = 'date';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'date',
        'revenue',
        'expense',
        'net_profit',
        'avg_order_value',
        'reservations_count',
        'reservations_paid',
        'reservations_cancelled',
        'food_orders_count',
        'food_orders_paid',
        'food_orders_cancelled',
        'visitors',
        'new_customers',
        'returning_customers',
        'stock_value',
        'stockout_count',
        'waste_value',
        'occupancy_rate',
        'refund_amount',
        'gateway_fee',
        'generated_at',
    ];

    protected $casts = [
        'date' => 'date',
        'revenue' => 'decimal:2',
        'expense' => 'decimal:2',
        'net_profit' => 'decimal:2',
        'avg_order_value' => 'decimal:2',
        'reservations_count' => 'integer',
        'reservations_paid' => 'integer',
        'reservations_cancelled' => 'integer',
        'food_orders_count' => 'integer',
        'food_orders_paid' => 'integer',
        'food_orders_cancelled' => 'integer',
        'visitors' => 'integer',
        'new_customers' => 'integer',
        'returning_customers' => 'integer',
        'stock_value' => 'decimal:2',
        'stockout_count' => 'integer',
        'waste_value' => 'decimal:2',
        'occupancy_rate' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'gateway_fee' => 'decimal:2',
        'generated_at' => 'datetime',
    ];
}
