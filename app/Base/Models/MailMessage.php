<?php

namespace App\Base\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * 受注に紐づくメール送信ログ（会話履歴）
 * - 会話キーは receive_order_id 固定
 */
class MailMessage extends Model
{
    use HasFactory;

    protected $table = 't_mail_messages';

    protected $fillable = [
        'receive_order_id',
        'customer_id',
        'direction',
        'send_status',
        'to_email',
        'subject',
        'body',
        'mail_template_id',
        'sent_at',
        'error_message',
        'created_by',
    ];

    protected $casts = [
        'receive_order_id' => 'integer',
        'customer_id' => 'integer',
        'direction' => 'integer',
        'send_status' => 'integer',
        'mail_template_id' => 'integer',
        'created_by' => 'integer',
        'sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(MailTemplate::class, 'mail_template_id');
    }

    public function inquiryLinkReceiveOrderSales()
    {
        // このモデル自体は受注ID固定なので、売上との紐づけ参照が必要なら LinkReceiveOrderSale を使う
        return $this->hasMany(LinkReceiveOrderSale::class, 'receive_order_id', 'receive_order_id');
    }
}
