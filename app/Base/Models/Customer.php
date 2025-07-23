<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $table = 't_customers';

    protected $fillable = [
        'rank_id',
        'distinguish',
        'name',
        'kana',
        'nickname',
        'email_pc',
        'email_phone',
        'zip_code',
        'prefectures',
        'municipality',
        'number',
        'tel',
        'fax',
        'tel_phone',
        'birthday',
        'gender',
        'occupation',
        'motorcycle_maker_id1',
        'motorcycle_maker_id2',
        'motorcycle_maker_id3',
        'workplace',
        'workplace_zip_code',
        'workplace_prefectures',
        'workplace_municipality',
        'workplace_number',
        'workplace_tel',
        'workplace_fax',
        'is_send_post_information',
        'is_send_email_information',
        'password',
        'password_reminder',
        'rate',
        'fraction',
        'notice',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}
