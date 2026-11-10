<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiDecision extends Model
{
    protected $table = 'bi_decisions';

    protected $fillable = [
        'title',
        'hypothesis',
        'metric',
        'target',
        'evaluate_at',
        'status',
        'created_by',
        'result_note',
    ];

    protected $casts = [
        'evaluate_at' => 'date',
    ];

    public const STATUSES = ['direncanakan', 'berjalan', 'terbukti', 'tidak_berhasil'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
