<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Image extends Model
{
    use SoftDeletes;

    protected $table = 'm_images';

    protected $fillable = [
        'category_id',
        'item_id',
        'item_code',
        'name',
        'order_by',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

    /** 画像の属するカテゴリ */
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /** 公開URL（public/images 配下想定） */
    public function getPublicUrlAttribute()
    {
        return $this->name ? '/images/' . $this->name : null;
    }
}
