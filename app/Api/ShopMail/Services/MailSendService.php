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
        Log::info('[ShopMail][sendOrderMail] enter', [
            'receive_order_id' => $receiveOrderId,
            'payload_keys'     => array_keys($payload),
        ]);

        // 宛先：payload 指定が優先
        $to = trim((string)($payload['to_email'] ?? ''));
        if ($to === '') {
            $to = (string)(DB::table('t_receive_orders')->where('id', $receiveOrderId)->value('email') ?? '');
        }
        if ($to === '') {
            return ['ok' => false, 'message' => '宛先メールアドレスが取得できませんでした'];
        }

        // template_id / mail_template_id どちらでも受ける（フロント差分吸収）
        $templateId = null;
        if (!empty($payload['template_id'])) $templateId = (int)$payload['template_id'];
        if ($templateId === null && !empty($payload['mail_template_id'])) $templateId = (int)$payload['mail_template_id'];

        // subject/body を決定（テンプレ優先、無ければ手入力）
        $subject = trim((string)($payload['subject'] ?? ''));
        $payloadBody = (string)($payload['body'] ?? ($payload['body_text'] ?? ''));
        $bodyText = $payloadBody;
        $bodyHtml = null;

        if ($templateId) {
            $tpl = DB::table('m_mail_templates')->where('id', $templateId)->whereNull('deleted_at')->first();
            if (!$tpl) return ['ok' => false, 'message' => 'テンプレートが存在しません'];

            $payloadSubject = trim((string)($payload['subject'] ?? ''));
            $subject = $payloadSubject !== '' ? $payloadSubject : trim((string)($tpl->subject_template ?? ''));
            if ($subject === '') $subject = '（件名未設定）';

            if (trim($payloadBody) === '') {
                // 本文が送られていない旧形式だけ、テンプレから本文を組み立てる。
                $bodyText = $this->composeFromTemplateText($receiveOrderId, $tpl, $payload);
                $bodyHtml = $this->composeFromTemplateHtml($receiveOrderId, $tpl, $payload);
            } else {
                // 個別返信画面では、テンプレ選択後に編集済み本文が送られる。
                // その場合もテンプレ側の明細表示などの設定だけは反映する。
                $bodyText = $this->applyTemplateAddonsToPayloadBody($receiveOrderId, $tpl, $payload, $payloadBody);
            }
        }

        if ($subject === '') return ['ok' => false, 'message' => '件名が空です'];
        if (trim($bodyText) === '') return ['ok' => false, 'message' => '本文が空です'];

        $now = now();
        $createdBy = Auth::id();
        $sendStatus = 1;
        $error = null;
        $from = $this->resolveFromAddress();

        if ($from === '') {
            return ['ok' => false, 'message' => '送信元メールアドレスが設定されていません'];
        }

        try {
            if ($bodyHtml !== null) {
                Mail::html($bodyHtml, function ($m) use ($to, $subject, $from) {
                    $this->applyFrom($m, $from);
                    $m->to($to)->subject($subject);
                });
            } else {
                Mail::raw($bodyText, function ($m) use ($to, $subject, $from) {
                    $this->applyFrom($m, $from);
                    $m->to($to)->subject($subject);
                });
            }
        } catch (\Throwable $e) {
            $sendStatus = 2;
            $error = $e->getMessage();
            Log::error('[ShopMail] send order mail failed', [
                'receive_order_id' => $receiveOrderId,
                'to'               => $to,
                'error'            => $error,
            ]);
        }

        DB::table('t_mail_messages')->insert([
            'receive_order_id'  => $receiveOrderId,
            'customer_id'       => null,
            'direction'         => 1,
            'send_status'       => $sendStatus,
            'to_email'          => $to,
            'subject'           => $subject,
            'body'              => $bodyText, // 履歴はテキストで保存
            'mail_template_id'  => $templateId,
            'sent_at'           => $sendStatus === 1 ? $now : null,
            'error_message'     => $error,
            'created_by'        => $createdBy,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);

        return [
            'ok'      => $sendStatus === 1,
            'message' => $sendStatus === 1 ? '送信しました' : '送信に失敗しました',
            'to'      => $to,
            'error'   => $error,
        ];
    }

    public function sendInquiryMail(int $inquiryId, array $payload): array
    {
        $inq = DB::table('t_inquiries')->where('id', $inquiryId)->whereNull('deleted_at')->first();
        if (!$inq) return ['ok' => false, 'message' => '問い合わせが存在しません'];

        $to = trim((string)($payload['to_email'] ?? ($inq->email ?? '')));
        if ($to === '') return ['ok' => false, 'message' => '宛先メールアドレスが取得できませんでした'];

        $templateId = null;
        if (!empty($payload['template_id'])) $templateId = (int)$payload['template_id'];
        if ($templateId === null && !empty($payload['mail_template_id'])) $templateId = (int)$payload['mail_template_id'];

        $subject = trim((string)($payload['subject'] ?? ''));
        $body    = (string)($payload['body_text'] ?? ($payload['body'] ?? ''));

        if ($templateId) {
            $tpl = DB::table('m_mail_templates')->where('id', $templateId)->whereNull('deleted_at')->first();
            if (!$tpl) return ['ok' => false, 'message' => 'テンプレートが存在しません'];

            $payloadSubject = trim((string)($payload['subject'] ?? ''));
            $subject = $payloadSubject !== '' ? $payloadSubject : trim((string)($tpl->subject_template ?? ''));
        }

        if ($subject === '') return ['ok' => false, 'message' => '件名が空です'];
        if (trim($body) === '') return ['ok' => false, 'message' => '本文が空です'];

        $now = now();
        $personnelId = (int)(Auth::id() ?? 0);

        $sendStatus = 1;
        $error = null;
        $from = $this->resolveFromAddress();

        if ($from === '') {
            return ['ok' => false, 'message' => '送信元メールアドレスが設定されていません'];
        }

        try {
            Mail::raw($body, function ($m) use ($to, $subject, $from) {
                $this->applyFrom($m, $from);
                $m->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            $sendStatus = 2;
            $error = $e->getMessage();
            Log::error('[ShopMail] send inquiry mail failed', [
                'inquiry_id' => $inquiryId,
                'to'         => $to,
                'error'      => $error,
            ]);
        }

        DB::table('t_inquiries_history')->insert([
            'inquiries_id'     => $inquiryId,
            'personnels_id'    => $personnelId > 0 ? $personnelId : 1,
            'reply_content'    => null,
            'subject'          => $subject,
            'body_text'        => $body,
            'mail_template_id' => $templateId,
            'send_status'      => $sendStatus,
            'error_message'    => $error ? mb_substr((string)$error, 0, 2000) : '',
            'reply_at'         => $sendStatus === 1 ? $now : null,
            'is_expired_email' => $sendStatus === 1 ? 1 : 0,
            'created_at'       => $now,
            'updated_at'       => $now,
            'deleted_at'       => null,
        ]);

        return [
            'ok'      => $sendStatus === 1,
            'message' => $sendStatus === 1 ? '送信しました' : '送信に失敗しました',
            'to'      => $to,
            'error'   => $error,
        ];
    }

    private function resolveFromAddress(): string
    {
        $from = trim((string) config('mail.from.address', ''));
        if ($from !== '') {
            return $from;
        }

        return trim((string) config('mail.mailers.smtp.username', ''));
    }

    private function resolveFromName(): string
    {
        $name = trim((string) config('mail.from.name', ''));
        return $name !== '' ? $name : config('app.name', 'Touratech');
    }

    private function applyFrom($message, string $from): void
    {
        $message->from($from, $this->resolveFromName());
    }

    private function composeFromTemplateText(int $receiveOrderId, object $tpl, array $payload): string
    {
        $includeDetails = array_key_exists('include_details', $payload)
            ? (bool)$payload['include_details']
            : ((int)($tpl->detail_mode ?? 0) === 1);

        Log::info('[ShopMail][composeFromTemplate] includeDetails', [
            'include' => $includeDetails,
            'receive_order_id' => $receiveOrderId,
        ]);

        $paymentUrl = trim((string)($payload['payment_url'] ?? ''));
        $payloadBody = trim((string)($payload['body_text'] ?? ($payload['body'] ?? '')));

        $parts = [];
        if ($payloadBody !== '') {
            $parts[] = $payloadBody;
        } else {
            $head = rtrim((string)($tpl->header_template ?? ''));
            if ($head !== '') $parts[] = $head;
        }

        if ($includeDetails) {
            $parts[] = $this->renderOrderDetailsTextBySettings($receiveOrderId);
        }

        if (((int)($tpl->payment_url_enabled ?? 0) === 1) && $paymentUrl !== '') {
            $parts[] = "▼お支払いページ\n" . $paymentUrl;
        }

        $shippingText = trim((string)($tpl->shipping_text ?? ''));
        if ($shippingText !== '') {
            $parts[] = $shippingText;
        }

        if ($payloadBody === '') {
            $foot = rtrim((string)($tpl->footer_template ?? ''));
            if ($foot !== '') $parts[] = $foot;
        }

        return trim(implode("\n\n", array_filter($parts, fn($v) => trim((string)$v) !== '')));
    }

    private function composeFromTemplateHtml(int $receiveOrderId, object $tpl, array $payload): string
    {
        $includeDetails = array_key_exists('include_details', $payload)
            ? (bool)$payload['include_details']
            : ((int)($tpl->detail_mode ?? 0) === 1);

        $paymentUrl = trim((string)($payload['payment_url'] ?? ''));
        $payloadBody = trim((string)($payload['body_text'] ?? ($payload['body'] ?? '')));

        $mono = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;";

        $partsHtml = [];

        if ($payloadBody !== '') {
            $partsHtml[] = '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($payloadBody) . '</pre>';
        } else {
            $head = rtrim((string)($tpl->header_template ?? ''));
            if ($head !== '') {
                $partsHtml[] = '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($head) . '</pre>';
            }
        }

        if ($includeDetails) {
            $partsHtml[] = $this->renderOrderDetailsHtmlBySettings($receiveOrderId);
        }

        if (((int)($tpl->payment_url_enabled ?? 0) === 1) && $paymentUrl !== '') {
            $txt = "▼お支払いページ\n" . $paymentUrl;
            $partsHtml[] = '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($txt) . '</pre>';
        }

        $shippingText = trim((string)($tpl->shipping_text ?? ''));
        if ($shippingText !== '') {
            $partsHtml[] = '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($shippingText) . '</pre>';
        }

        if ($payloadBody === '') {
            $foot = rtrim((string)($tpl->footer_template ?? ''));
            if ($foot !== '') {
                $partsHtml[] = '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($foot) . '</pre>';
            }
        }

        return implode("\n", array_filter($partsHtml, fn($v) => trim((string)$v) !== ''));
    }

    private function applyTemplateAddonsToPayloadBody(int $receiveOrderId, object $tpl, array $payload, string $body): string
    {
        $body = $this->normalizeLineEndings($body);
        $addons = [];

        $includeDetails = array_key_exists('include_details', $payload)
            ? (bool)$payload['include_details']
            : ((int)($tpl->detail_mode ?? 0) === 1);

        if ($includeDetails && !$this->bodyAlreadyHasOrderDetails($body)) {
            $addons[] = $this->renderOrderDetailsTextBySettings($receiveOrderId);
        }

        $paymentUrl = trim((string)($payload['payment_url'] ?? ''));
        if (((int)($tpl->payment_url_enabled ?? 0) === 1) && $paymentUrl !== '') {
            $paymentBlock = "▼お支払いページ\n" . $paymentUrl;
            if (!str_contains($body, $paymentBlock)) {
                $addons[] = $paymentBlock;
            }
        }

        $shippingText = trim($this->normalizeLineEndings((string)($tpl->shipping_text ?? '')));
        if ($shippingText !== '' && !str_contains($body, $shippingText)) {
            $addons[] = $shippingText;
        }

        if ($addons === []) {
            return $body;
        }

        Log::info('[ShopMail][sendOrderMail] apply template addons to payload body', [
            'receive_order_id' => $receiveOrderId,
            'include_details' => $includeDetails,
            'addon_count' => count($addons),
        ]);

        $addonText = trim(implode("\n\n", array_filter($addons, fn($v) => trim((string)$v) !== '')));
        return $this->insertBeforeTemplateFooter($body, (string)($tpl->footer_template ?? ''), $addonText);
    }

    private function insertBeforeTemplateFooter(string $body, string $footer, string $insertText): string
    {
        $body = rtrim($this->normalizeLineEndings($body));
        $footer = rtrim($this->normalizeLineEndings($footer));
        $insertText = trim($this->normalizeLineEndings($insertText));

        if ($insertText === '') {
            return $body;
        }

        if ($footer !== '') {
            $pos = strrpos($body, $footer);
            if ($pos !== false && ($pos + strlen($footer)) === strlen($body)) {
                $before = rtrim(substr($body, 0, $pos));
                $after = ltrim(substr($body, $pos));

                return trim(implode("\n\n", array_filter([$before, $insertText, $after], fn($v) => trim((string)$v) !== '')));
            }
        }

        return trim(implode("\n\n", array_filter([$body, $insertText], fn($v) => trim((string)$v) !== '')));
    }

    private function bodyAlreadyHasOrderDetails(string $body): bool
    {
        return str_contains($body, '■ ご注文商品')
            || str_contains($body, '■ ご注文情報')
            || str_contains($body, '■ 金額内訳');
    }

    private function normalizeLineEndings(string $value): string
    {
        return str_replace(["\r\n", "\r"], "\n", $value);
    }

    /**
     * 明細（ShopMail側）も EC と同一レイアウトに寄せる：
     * - m_mail_detail_settings の is_display=1 & display_label で表示制御
     * - 変なズレが残りやすい「金額内訳」は HTML table（罫線/背景なし）で右揃え固定
     */
    private function renderOrderDetailsTextBySettings(int $receiveOrderId): string
    {
        $struct = $this->buildOrderDetailsStructBySettings($receiveOrderId);

        // テキスト版は “表も内訳も” 文字列で返す（履歴用）
        $out = $struct['text_lines'];
        return implode("\n", $out);
    }

    private function renderOrderDetailsHtmlBySettings(int $receiveOrderId): string
    {
        $struct = $this->buildOrderDetailsStructBySettings($receiveOrderId);

        $mono = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;";

        $preTop = implode("\n", $struct['html_pre_top_lines']);
        $preBottom = implode("\n", $struct['html_pre_bottom_lines']);

        $amountTable = $this->renderAmountsTableHtml($struct['amount_rows']);

        // pre（上）→ table（内訳）→ pre（下） の順で組み立て
        $html = '';
        $html .= '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($preTop) . "</pre>\n";
        $html .= $amountTable . "\n";
        $html .= '<pre style="' . $mono . ' white-space:pre; line-height:1.6;">' . $this->escapeForPre($preBottom) . "</pre>\n";

        return $html;
    }

    /**
     * settings を反映して、明細部に必要な情報を組み立てる（テキスト/HTML両対応用）
     */
    private function buildOrderDetailsStructBySettings(int $receiveOrderId): array
    {
        $order = DB::table('t_receive_orders')->where('id', $receiveOrderId)->first();
        if (!$order) {
            return [
                'text_lines' => ['（受注が見つかりません）'],
                'html_pre_top_lines' => ['（受注が見つかりません）'],
                'html_pre_bottom_lines' => [''],
                'amount_rows' => [],
            ];
        }

        $details = DB::table('t_receive_order_details')
            ->where('receive_order_id', $receiveOrderId)
            ->orderBy('id', 'asc')
            ->get();

        $settings = DB::table('m_mail_detail_settings')
            ->whereNull('deleted_at')
            ->orderBy('id', 'asc')
            ->get();

        $enabled = [];
        $labels = [];

        foreach ($settings as $s) {
            if ((int)($s->is_display ?? 0) !== 1) continue;
            $k = trim((string)($s->field_key ?? ''));
            if ($k === '') continue;
            $enabled[] = $k;
            $labels[$k] = trim((string)($s->display_label ?? '')) !== '' ? (string)$s->display_label : $k;
        }

        Log::info('[ShopMail][mail_detail_settings] loaded', [
            'count'   => $settings->count(),
            'enabled' => $enabled,
        ]);

        $has = fn(string $k) => in_array($k, $enabled, true);

        // grand_total は「最後に必ず」出したいのでフラグ化
        $grandEnabled = $has('grand_total');
        $grandLabel   = $labels['grand_total'] ?? '合計';

        // 支払方法名（payment_id -> m_payments.id）
        $paymentName = '';
        if ($has('payment_method')) {
            $paymentName = (string) DB::table('m_payments')
                ->whereNull('deleted_at')
                ->where('id', (int)($order->payment_id ?? 0))
                ->value('name');
            $paymentName = trim($paymentName) !== '' ? trim($paymentName) : '不明';
        }

        // 発注日（order_date）は日付だけ
        $orderDate = '';
        if ($has('order_date')) {
            $orderDate = (string)($order->receive_order_date ?? $order->created_at ?? '');
            if ($orderDate !== '') $orderDate = substr($orderDate, 0, 10);
        }

        $usePoints = $has('use_points') ? (int)($order->use_points ?? 0) : null;

        $pointsDiscountYen = (int)round((float)($order->discount ?? 0));
        if ($pointsDiscountYen < 0) $pointsDiscountYen = 0;

        $shipping = (int)round((float)($order->shipping_amount ?? 0));
        $codFee   = (int)round((float)($order->fee ?? 0));
        $extraShipping = (int)round((float)($order->additional_shipping_amount ?? 0));

        // 商品合計（税込）= 明細 amount 合計
        $itemsTotalInc = 0;
        foreach ($details as $d) {
            $itemsTotalInc += (int)round((float)($d->amount ?? 0));
        }
        if ($itemsTotalInc < 0) $itemsTotalInc = 0;

        // お買い上げ金額(税込) = 商品合計 - ポイント割引
        $itemsPayable = $itemsTotalInc - $pointsDiscountYen;
        if ($itemsPayable < 0) $itemsPayable = 0;

        // 合計 = (商品合計 + 送料 + 追加送料 + 代引手数料) - ポイント割引
        $grandTotalCalc = ($itemsTotalInc + $shipping + $extraShipping + $codFee) - $pointsDiscountYen;
        if ($grandTotalCalc < 0) $grandTotalCalc = 0;

        // variations1〜4 を item_id から取得して結合（S/青 など）
        $itemIds = $details->pluck('item_id')->filter()->unique()->values()->all();
        $itemVars = [];
        if (!empty($itemIds)) {
            $itemVars = DB::table('m_items')
                ->select(['id', 'variations1', 'variations2', 'variations3', 'variations4'])
                ->whereIn('id', $itemIds)
                ->get()
                ->keyBy('id')
                ->toArray();
        }

        $rows = [];
        foreach ($details as $d) {
            $itemId = (int)($d->item_id ?? 0);

            $variationText = '';
            if ($itemId > 0 && isset($itemVars[$itemId])) {
                $it = $itemVars[$itemId];
                $parts = [];
                foreach (['variations1','variations2','variations3','variations4'] as $col) {
                    $val = '';
                    if (is_object($it)) $val = trim((string)($it->{$col} ?? ''));
                    if (is_array($it))  $val = trim((string)($it[$col] ?? ''));
                    if ($val !== '') $parts[] = $val;
                }
                $variationText = implode('/', $parts);
            }

            $rows[] = [
                'item_name' => (string)($d->item_name ?? ''),
                'model_no'  => (string)($d->item_number ?? $d->model_no ?? ''),
                'variation' => $variationText,
                'unit_price_tax_in' => (int)round((float)($d->sales_unit_price ?? 0)),
                'qty' => (int)($d->quantity ?? 0),
                'subtotal' => (int)round((float)($d->amount ?? 0)),
            ];
        }

        $totalWidth = 92;
        $lineSep    = str_repeat('-', $totalWidth);

        // ====== ご注文情報（テキスト/HTMLの pre 上側に含める）======
        $preTop = [];
        $preTop[] = $lineSep;
        $preTop[] = "■ ご注文情報";

        if ($has('order_no')) {
            $preTop[] = "  {$labels['order_no']}：{$this->safeStr($order->order_no ?? $order->id)}";
        }
        if ($has('order_date')) {
            $preTop[] = "  {$labels['order_date']}：{$orderDate}";
        }
        if ($has('payment_method')) {
            $preTop[] = "  {$labels['payment_method']}：{$paymentName}";
        }
        if ($has('use_points')) {
            $preTop[] = "  {$labels['use_points']}：" . (string)($usePoints ?? 0);
        }

        $preTop[] = $lineSep;
        $preTop[] = "";

        // 銀行振込のご案内（bank_account）
        if ($has('bank_account') && $paymentName === '銀行振込') {
            $preTop[] = "■ 銀行振込のご案内";
            $preTop[] = "  {$labels['bank_account']}";
            $preTop[] = "";

            $cfg = DB::table('m_configs')->whereNull('deleted_at')->orderBy('id', 'asc')->first();
            $preTop[] = "  銀行名：" . $this->safeStr($cfg->bank_name1 ?? '');
            $preTop[] = "  支店名：" . $this->safeStr($cfg->branch_name1 ?? '');
            $preTop[] = "  口座番号：" . $this->safeStr($cfg->account_number1 ?? '');
            $preTop[] = "  口座名義：" . $this->safeStr($cfg->account_name1 ?? '');

            $preTop[] = $lineSep;
            $preTop[] = "";
        }

        // ====== ご注文商品（pre 上側に含める）======
        $preTop[] = "■ ご注文商品";

        $colItem  = $labels['item_name'] ?? '商品名';
        $colVar   = $labels['variation'] ?? '詳細';
        $colModel = $labels['model_no'] ?? '型番';
        $colUnit  = $labels['unit_price_tax_in'] ?? '税込単価';
        $colQty   = $labels['qty'] ?? '注文数';
        $colSub   = $labels['subtotal'] ?? '小計';

        $w = 16;
        $wMoney = 12;

        $showVarCol = $has('variation');

        $header = '';
        $header .= $this->mbPadRight($colItem, $w);
        if ($showVarCol) $header .= $this->mbPadRight($colVar, $w);
        $header .= $this->mbPadRight($colModel, $w);
        $header .= $this->mbPadLeft($colUnit, $wMoney);
        $header .= $this->mbPadLeft($colQty, $wMoney);
        $header .= $this->mbPadLeft($colSub, $wMoney);

        $preTop[] = $header;
        $preTop[] = $lineSep;

        if ($rows === []) {
            $preTop[] = "（明細がありません）";
        } else {
            foreach ($rows as $r) {
                $model = trim((string)$r['model_no']) !== '' ? (string)$r['model_no'] : '-';
                $var   = (string)($r['variation'] ?? '');

                $line = '';
                $line .= $this->mbPadRight($this->safeStr($r['item_name']), $w);
                if ($showVarCol) $line .= $this->mbPadRight($this->safeStr($var), $w);
                $line .= $this->mbPadRight($this->safeStr($model), $w);
                $line .= $this->mbPadLeft($this->yen($r['unit_price_tax_in']), $wMoney);
                $line .= $this->mbPadLeft((string)$r['qty'], $wMoney);
                $line .= $this->mbPadLeft($this->yen($r['subtotal']), $wMoney);

                $preTop[] = $line;
            }
        }

        $preTop[] = $lineSep;
        $preTop[] = "";
        $preTop[] = "■ 金額内訳";

        // ====== 金額内訳（行データ）======
        $amountRows = [];

        foreach ($enabled as $k) {
            if ($k === 'grand_total') continue;

            switch ($k) {
                case 'items_total_tax_in':
                    $amountRows[] = ['label' => $labels[$k], 'value' => $this->yen($itemsPayable)];
                    break;
                case 'shipping_fee_tax_in':
                    $amountRows[] = ['label' => $labels[$k], 'value' => $this->yen($shipping)];
                    break;
                case 'extra_shipping_tax_in':
                    $amountRows[] = ['label' => $labels[$k], 'value' => $this->yen($extraShipping)];
                    break;
                case 'cod_fee_tax_in':
                    $amountRows[] = ['label' => $labels[$k], 'value' => $this->yen($codFee)];
                    break;
                case 'use_points':
                    $amountRows[] = ['label' => $labels[$k], 'value' => (string)($usePoints ?? 0)];
                    break;
                case 'earned_points':
                    $amountRows[] = ['label' => $labels[$k], 'value' => '0'];
                    break;
            }
        }

        if ($grandEnabled) {
            $amountRows[] = ['label' => $grandLabel, 'value' => $this->yen($grandTotalCalc)];
        }

        // ====== pre 下側（HTMLでは table の後に出す）======
        $preBottom = [];
        $preBottom[] = $lineSep;

        // ====== テキスト全体（履歴用）は amountRows もテキスト化して含める ======
        $textLines = $preTop;
        foreach ($amountRows as $r) {
            // テキスト側は一応 pad する（HTML側が正）
            $label = (string)($r['label'] ?? '');
            $value = (string)($r['value'] ?? '');
            $textLines[] = $this->labelAmountText($label, $value);
        }
        $textLines = array_merge($textLines, $preBottom);

        return [
            'text_lines' => $textLines,
            'html_pre_top_lines' => $preTop,
            'html_pre_bottom_lines' => $preBottom,
            'amount_rows' => $amountRows,
        ];
    }

    private function renderAmountsTableHtml(array $amountRows): string
    {
        // 罫線/背景なし。右揃え固定。
        $tr = '';
        foreach ($amountRows as $r) {
            $label = htmlspecialchars((string)($r['label'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $value = htmlspecialchars((string)($r['value'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            $tr .= '<tr>'
                . '<td style="padding:2px 12px 2px 0; white-space:nowrap;">' . $label . '</td>'
                . '<td style="padding:2px 0; text-align:right; white-space:nowrap;">' . $value . '</td>'
                . '</tr>';
        }

        return '<table style="border-collapse:collapse; border:0; width:100%; max-width:720px;">' . $tr . '</table>';
    }

    private function escapeForPre(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function yen(int $n): string
    {
        // 半角¥に統一（幅ズレしにくい）
        return '¥' . number_format($n);
    }

    private function safeStr($v): string
    {
        return trim((string)($v ?? ''));
    }

    private function mbPadRight(string $s, int $width, string $pad = ' '): string
    {
        $len = mb_strwidth($s, 'UTF-8');
        if ($len >= $width) return $s;
        return $s . str_repeat($pad, $width - $len);
    }

    private function mbPadLeft(string $s, int $width, string $pad = ' '): string
    {
        $len = mb_strwidth($s, 'UTF-8');
        if ($len >= $width) return $s;
        return str_repeat($pad, $width - $len) . $s;
    }

    private function labelAmountText(string $label, string $value): string
    {
        // テキスト版は暫定（HTML版が正）
        // 76 + 12 の固定幅
        $labelPart = $this->mbPadRight($label, 76);
        $valuePart = $this->mbPadLeft($value, 12);
        return $labelPart . $valuePart;
    }
}
