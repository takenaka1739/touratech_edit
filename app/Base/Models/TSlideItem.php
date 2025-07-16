<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Base\Models\MImage;

class TSlideItem extends Model
{
    use SoftDeletes;

    protected $table = 't_slide_items';

    protected $fillable = [
        'image_id',
        'url',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    /**
     * 画像（m_images）とのリレーション
     */
    public function image()
    {
        return $this->belongsTo(MImage::class, 'image_id', 'id');
    }
}
