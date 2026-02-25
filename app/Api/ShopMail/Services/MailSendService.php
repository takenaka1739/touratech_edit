<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailSendService
{
    public function sendOrderMail(int $receiveOrderId, array $payload): array
    {
        // 宛先：payload 指定が優先
        $to = trim((string)($payload['to_email'] ?? ''));
        if ($to === '') {
            // 受注から email を拾う（列名は運用に合わせて調整）
            $to = (string) (DB::table('t_receive_orders')->where('id', $receiveOrderId)->value('email') ?? '');
        }
        if ($to === '') {
            return ['ok' => false, 'message' => '宛先メールアドレスが取得できませんでした'];
        }

        $templateId = !empty($payload['template_id']) ? (int)$payload['template_id'] : null;

        // subject/body を決定（テンプレ優先、無ければ手入力）
        $subject = trim((string)($payload['subject'] ?? ''));
        $body    = (string)($payload['body'] ?? '');

        if ($templateId) {
            $tpl = DB::table('m_mail_templates')->where('id', $templateId)->whereNull('deleted_at')->first();
            if (!$tpl) return ['ok' => false, 'message' => 'テンプレートが存在しません'];

            $subject = (string)$tpl->subject_template;
            $body    = $this->composeFromTemplate($receiveOrderId, $tpl, $payload);
        }

        if ($subject === '') return ['ok' => false, 'message' => '件名が空です'];
        if (trim($body) === '') return ['ok' => false, 'message' => '本文が空です'];

        // 送信＆ログ（t_mail_messages）
        $now = now();
        $createdBy = Auth::id(); // m_personnels.id と同一運用ならそのままでOK
        $sendStatus = 1;
        $error = null;

        try {
            Mail::raw($body, function ($m) use ($to, $subject) {
                $m->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            $sendStatus = 2;
            $error = $e->getMessage();
            Log::error('[ShopMail] send order mail failed', [
                'receive_order_id' => $receiveOrderId,
                'to' => $to,
                'error' => $error,
            ]);
        }

        DB::table('t_mail_messages')->insert([
            'receive_order_id' => $receiveOrderId,
            'customer_id'      => null,
            'direction'        => 1,
            'send_status'      => $sendStatus,
            'to_email'         => $to,
            'subject'          => $subject,
            'body'             => $body,
            'mail_template_id' => $templateId,
            'sent_at'          => $sendStatus === 1 ? $now : null,
            'error_message'    => $error,
            'created_by'       => $createdBy,
            'created_at'       => $now,
            'updated_at'       => $now,
        ]);

        return ['ok' => $sendStatus === 1, 'message' => $sendStatus === 1 ? '送信しました' : '送信に失敗しました', 'to' => $to];
    }

    public function sendInquiryMail(int $inquiryId, array $payload): array
    {
        $inq = DB::table('t_inquiries')->where('id', $inquiryId)->whereNull('deleted_at')->first();
        if (!$inq) return ['ok' => false, 'message' => '問い合わせが存在しません'];

        $to = trim((string)($payload['to_email'] ?? $inq->email ?? ''));
        if ($to === '') return ['ok' => false, 'message' => '宛先メールアドレスが取得できませんでした'];

        $templateId = !empty($payload['template_id']) ? (int)$payload['template_id'] : null;

        $subject = trim((string)($payload['subject'] ?? ''));
        $body    = (string)($payload['body'] ?? '');

        if ($templateId) {
            $tpl = DB::table('m_mail_templates')->where('id', $templateId)->whereNull('deleted_at')->first();
            if (!$tpl) return ['ok' => false, 'message' => 'テンプレートが存在しません'];

            $subject = (string)$tpl->subject_template;

            // 問い合わせは受注明細ではなく、テンプレのヘッダ/フッタ中心に構成
            $body = trim(implode("\n\n", array_filter([
                (string)($tpl->header_template ?? ''),
                (string)($payload['body'] ?? ''), // 返信本文を中央に入れる運用
                (string)($tpl->footer_template ?? ''),
            ])));
        }

        if ($subject === '') return ['ok' => false, 'message' => '件名が空です'];
        if (trim($body) === '') return ['ok' => false, 'message' => '本文が空です'];

        $now = now();
        $personnelId = (int)(Auth::id() ?? 0);

        $sendOk = true;
        $error = null;

        try {
            Mail::raw($body, function ($m) use ($to, $subject) {
                $m->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            $sendOk = false;
            $error = $e->getMessage();
            Log::error('[ShopMail] send inquiry mail failed', [
                'inquiry_id' => $inquiryId,
                'to' => $to,
                'error' => $error,
            ]);
        }

        // t_inquiries_history に保存（返信本文・返信日時・配信有無）
        DB::table('t_inquiries_history')->insert([
            'inquiries_id'     => $inquiryId,
            'personnels_id'    => $personnelId > 0 ? $personnelId : 1,
            'reply_content'    => $body,
            'reply_at'         => $sendOk ? $now : null,
            'is_expired_email' => $sendOk ? 1 : 0,
            'created_at'       => $now,
            'updated_at'       => $now,
            'deleted_at'       => null,
        ]);

        return ['ok' => $sendOk, 'message' => $sendOk ? '送信しました' : '送信に失敗しました', 'to' => $to, 'error' => $error];
    }

    private function composeFromTemplate(int $receiveOrderId, object $tpl, array $payload): string
    {
        $includeDetails = array_key_exists('include_details', $payload)
            ? (bool)$payload['include_details']
            : ((int)($tpl->detail_mode ?? 0) === 1);

        $paymentUrl = trim((string)($payload['payment_url'] ?? ''));

        $parts = [];
        $parts[] = rtrim((string)($tpl->header_template ?? ''));

        if ($includeDetails) {
            $parts[] = $this->renderOrderDetailsText($receiveOrderId);
        }

        if (((int)($tpl->payment_url_enabled ?? 0) === 1) && $paymentUrl !== '') {
            $parts[] = "▼お支払いページ\n" . $paymentUrl;
        }

        $shippingText = trim((string)($tpl->shipping_text ?? ''));
        if ($shippingText !== '') {
            $parts[] = $shippingText;
        }

        $parts[] = rtrim((string)($tpl->footer_template ?? ''));

        $body = trim(implode("\n\n", array_filter($parts, fn($v) => trim((string)$v) !== '')));
        return $body;
    }

    /**
     * 受注/明細をテキスト化（列名は必要に応じて調整）
     */
    private function renderOrderDetailsText(int $receiveOrderId): string
    {
        $order = DB::table('t_receive_orders')->where('id', $receiveOrderId)->first();
        $details = DB::table('t_receive_order_details')->where('receive_order_id', $receiveOrderId)->get();

        if (!$order) return "（受注が見つかりません）";

        // 明細表示設定（表示ONのみ）に従う
        $settings = DB::table('m_mail_detail_settings')
            ->whereNull('deleted_at')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $displayKeys = [];
        $labels = [];
        foreach ($settings as $s) {
            if ((int)($s->is_display ?? 0) !== 1) continue;
            $k = (string)$s->field_key;
            $displayKeys[] = $k;
            $labels[$k] = (string)($s->display_label ?? $k);
        }

        $lines = [];
        $lines[] = "▼ご注文内容";

        // 代表的なヘッダキー（field_key と合わせる運用）
        $headerMap = [
            'order_no' => (string)($order->order_no ?? $order->id),
            'order_date' => (string)($order->receive_order_date ?? $order->created_at ?? ''),
            'payment_method' => (string)($order->payment_method ?? $order->corporate_class ?? ''),
            'total_taxin' => (string)($order->total_amount ?? ''),
            'shipping_taxin' => (string)($order->shipping_amount ?? ''),
            'cod_fee_taxin' => (string)($order->fee ?? ''),
            'use_points' => (string)($order->use_points ?? $order->discount ?? ''),
        ];

        foreach ($headerMap as $k => $v) {
            if (!in_array($k, $displayKeys, true)) continue;
            $lines[] = ($labels[$k] ?? $k) . "：{$v}";
        }

        $lines[] = "";
        $lines[] = "▼明細";
        if ($details->isEmpty()) {
            $lines[] = "（明細がありません）";
            return implode("\n", $lines);
        }

        foreach ($details as $d) {
            $lines[] = "----";
            $lineMap = [
                'item_name' => (string)($d->item_name ?? ''),
                'item_code' => (string)($d->item_code ?? $d->code ?? ''),
                'model_no'  => (string)($d->model_no ?? $d->item_number ?? ''),
                'variation' => (string)($d->variation ?? ''),
                'unit_price_taxin' => (string)($d->sales_unit_price ?? $d->unit_price ?? ''),
                'qty' => (string)($d->quantity ?? 0),
                'subtotal_taxin' => (string)($d->amount ?? 0),
                'earn_points' => (string)($d->earn_points ?? ''),
            ];

            foreach ($lineMap as $k => $v) {
                if (!in_array($k, $displayKeys, true)) continue;
                $lines[] = ($labels[$k] ?? $k) . "：{$v}";
            }
        }

        return implode("\n", $lines);
    }
}
