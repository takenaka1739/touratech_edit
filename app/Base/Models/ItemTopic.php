<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class ItemTopic extends Model
{
    protected $table = 't_item_topics';

    protected $fillable = [
        'published_at',
        'title',
        'body',
    ];
}
