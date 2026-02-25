<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * メールテンプレートマスタ
 * - 自動返信(1) / 個別送信(2)
 */
class MailTemplate extends Model
{
    use HasFactory;

    protected $table = 'm_mail_templates';

    protected $fillable = [
        'template_type',
        'title',
        'subject_template',
        'header_template',
        'footer_template',
        'detail_mode',
        'payment_url_enabled',
        'shipping_text',
        'is_active',
    ];

    protected $casts = [
        'template_type' => 'integer',
        'detail_mode' => 'integer',
        'payment_url_enabled' => 'integer',
        'is_active' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** このテンプレートを使用した受注メール送信ログ */
    public function mailMessages()
    {
        return $this->hasMany(MailMessage::class, 'mail_template_id');
    }

    /** このテンプレートを使用した問い合わせ返信履歴 */
    public function inquiryHistories()
    {
        return $this->hasMany(InquiryHistory::class, 'mail_template_id');
    }
}
