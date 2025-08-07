<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $table = 't_topics';

    protected $fillable = [
        'published_at',
        'title',
        'body',
    ];
}
