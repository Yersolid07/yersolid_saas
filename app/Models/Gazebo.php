<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gazebo extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = ['name', 'facility_id', 'description', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function tables()
    {
        return $this->hasMany(QRCode::class, 'gazebo_id');
    }
}
