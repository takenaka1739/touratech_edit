<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Facades\Log;

class InquiryReplyService
{
    public function __construct(
        private MailSendService $mailSendService
    ) {}

    /**
     * 返信送信（問い合わせ）
     *
     * このサービスは「問い合わせ返信」の入口として残し、
     * 実処理（メール送信 + t_inquiries_history 保存）は MailSendService に一本化する。
     *
     * @param int $inquiryId t_inquiries.id
     * @param array $payload validated
     */
    public function send(int $inquiryId, array $payload): array
    {
        // ===== フロント/既存実装の差を吸収 =====
        // フロントは mail_template_id / body_text を送ってくる想定
        // MailSendService 既存は template_id / body を見ていたため、両対応に寄せる
        $normalized = $payload;

        if (!array_key_exists('template_id', $normalized) && array_key_exists('mail_template_id', $normalized)) {
            $normalized['template_id'] = $normalized['mail_template_id'];
        }
        if (!array_key_exists('body', $normalized) && array_key_exists('body_text', $normalized)) {
            $normalized['body'] = $normalized['body_text'];
        }

        Log::info('[InquiryReplyService][send] delegate to MailSendService', [
            'inquiries_id' => $inquiryId,
            'template_id' => $normalized['template_id'] ?? null,
            'to' => $normalized['to_email'] ?? null,
        ]);

        // ★送信＋履歴保存は MailSendService に一本化
        // MailSendService::sendInquiryMail は t_inquiries_history をスキーマ準拠で保存すること
        $res = $this->mailSendService->sendInquiryMail($inquiryId, $normalized);

        // Controller の期待に合わせてキーを整形（必要なら）
        // - フロントは ok を見ているので ok は維持
        // - message/to/error もそのまま返す
        return $res;
    }
}