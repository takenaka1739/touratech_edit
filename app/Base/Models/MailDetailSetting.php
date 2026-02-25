<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * 明細表示設定（共通1セット）
 * - field_key 単位で表示名/表示可否を持つ
 */
class MailDetailSetting extends Model
{
    use HasFactory;

    protected $table = 'm_mail_detail_settings';

    protected $fillable = [
        'field_key',
        'display_label',
        'is_display',
    ];

    protected $casts = [
        'is_display' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
