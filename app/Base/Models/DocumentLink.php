<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentLink extends Model
{
    use SoftDeletes;

    protected $table = 'm_documents_links';

    protected $fillable = [
      'item_id',
      'type_status_link',
      'type_name_link',
      'url',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];
}