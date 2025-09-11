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
        'name',
        'order_by',
    ];

    protected $hidden = ['created_at','updated_at','deleted_at'];

    public function getPublicUrlAttribute()
    {
        return $this->name ? '/images/' . $this->name : null; // 運用パスに合わせて変更可
    }
}
