<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosClosing extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'date',
        'opening_balance',
        'closing_balance',
        'actual_balance',
        'difference',
        'cash_100k',
        'cash_50k',
        'cash_20k',
        'cash_10k',
        'cash_5k',
        'cash_2k',
        'cash_1k',
        'coins',
        'total_cash_calculated',
        'note',
        'qris_expected',
        'qris_actual',
        'transfer_expected',
        'transfer_actual',
        'edc_expected',
        'edc_actual',
        'ewallet_expected',
        'ewallet_actual',
    ];

    protected $casts = [
        'date' => 'date',
        'opening_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'actual_balance' => 'decimal:2',
        'difference' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
