<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $table = 'm_documents';

    protected $fillable = [
      'item_id',
      'type_status',
      'type_name',
      'file_name',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

    /** 公開URL（public/images 配下想定） */
    public function getPublicUrlAttribute()
    {
      return $this->name ? '/images/' . $this->name : null;
    }
}