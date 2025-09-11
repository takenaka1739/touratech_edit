<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    protected $table = 'm_categories';

    protected $fillable = [
        'is_display',
        'code',
        'parent_id',
        'name',
        'remarks',
        'sort_order',
    ];

    protected $casts = [
        'is_display' => 'boolean',
        'parent_id'  => 'integer',
        'sort_order' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function images()
    {
        return $this->hasMany(Image::class, 'category_id')->orderBy('order_by')->orderBy('id');
    }

    public function thumb()
    {
        return $this->hasOne(Image::class, 'category_id')->oldest('order_by')->oldest('id');
    }

    // 互換用: parent_code を参照したい場面向け
    public function getParentCodeAttribute()
    {
        return optional($this->parent)->code;
    }
}
