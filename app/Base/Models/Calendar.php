<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Calendar extends Model
{
    use SoftDeletes;

    protected $table = 'm_calendars';

    protected $fillable = [
        'name',
        'start_at',
        'end_at',
        'is_monday',
        'is_tuesday',
        'is_wednesday',
        'is_thursday',
        'is_friday',
        'is_saturday',
        'is_sunday',
        'font_color',
        'back_color'
    ];

    protected $hidden = [
      'created_at',
      'updated_at',
      'deleted_at',
    ];

    public function getDiscontinuedDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y/m/d') : null;
    }
}
