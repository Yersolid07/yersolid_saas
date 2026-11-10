<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Setting extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = ['key', 'value', 'type', 'group'];

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, $default = null)
    {
        $settings = Cache::rememberForever('global_settings', function () {
            return self::pluck('value', 'key')->toArray();
        });

        return $settings[$key] ?? $default;
    }

    protected static function booted()
    {
        static::saved(function ($setting) {
            Cache::forget('global_settings');
            Cache::forget('cms_settings');
        });

        static::deleted(function ($setting) {
            Cache::forget('global_settings');
            Cache::forget('cms_settings');
        });
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, $value, $type = 'text', $group = 'general')
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type, 'group' => $group]
        );
    }
}
