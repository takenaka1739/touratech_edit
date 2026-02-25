<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 問い合わせ履歴（返信ログ）
 * 既存カラム + 今回追加した subject/body_text/mail_template_id/send_status/error_message を含む想定
 */
class InquiryHistory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 't_inquiries_history';

    protected $fillable = [
        'inquiries_id',
        'personnels_id',
        'reply_content',     // 既存（短文互換）
        'reply_at',
        'is_expired_email',  // 既存（互換）
        // 追加分
        'subject',
        'body_text',
        'mail_template_id',
        'send_status',
        'error_message',
    ];

    protected $casts = [
        'inquiries_id' => 'integer',
        'personnels_id' => 'integer',
        'is_expired_email' => 'integer',
        'mail_template_id' => 'integer',
        'send_status' => 'integer',
        'reply_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiries_id');
    }

    public function template()
    {
        return $this->belongsTo(MailTemplate::class, 'mail_template_id');
    }
}
