<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QRCode extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'label',
        'location_type',
        'location_id',
        'gazebo_id',
        'table_number',
        'image_path',
        'url',
    ];

    public function gazebo()
    {
        return $this->belongsTo(Gazebo::class);
    }
}
