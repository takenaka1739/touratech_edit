<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Personnel extends Model
{
    use SoftDeletes;

    protected $table = 'm_personnels';

    protected $fillable = [
        'name',
        'login_id',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
    ];
}
