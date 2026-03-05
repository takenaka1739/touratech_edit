<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MailDetailComposer
{
    public function build(int $receiveOrderId): string
    {
        $order = DB::table('t_receive_orders')->where('id', $receiveOrderId)->first();
        if (!$order) return '';

        $details = DB::table('t_receive_order_details')
            ->where('receive_order_id', $receiveOrderId)
            ->orderBy('id')
            ->get();

        $settings = DB::table('m_mail_detail_settings')
            ->where('is_display', 1)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();

        // ============================================
        // 表示カラム判定
        // ============================================

        $show = fn($key) => $settings->contains('field_key', $key);

        // ============================================
        // 幅設定（Bladeと同じ）
        // ============================================

        $W_NAME = 34;
        $W_CODE = 14;
        $W_UNIT = 12;
        $W_QTY  = 12;
        $W_SUB  = 12;
        $COL_GAP = '  ';
        $LINE_W = $W_NAME + $W_CODE + $W_UNIT + $W_QTY + $W_SUB + (mb_strwidth($COL_GAP,'UTF-8') * 4);

        $mbPad = function ($text, int $width, int $padType = STR_PAD_RIGHT) {
            $text = (string)($text ?? '');
            $w = mb_strwidth($text, 'UTF-8');
            if ($w > $width) {
                return mb_strimwidth($text, 0, $width, '', 'UTF-8');
            }
            $padLen = $width - $w;
            $pad = str_repeat(' ', $padLen);

            if ($padType === STR_PAD_LEFT) return $pad . $text;
            if ($padType === STR_PAD_BOTH) {
                $left = intdiv($padLen, 2);
                $right = $padLen - $left;
                return str_repeat(' ', $left) . $text . str_repeat(' ', $right);
            }
            return $text . $pad;
        };

        $yen = fn($n) => '￥' . number_format((int)$n);

        // ============================================
        // 明細生成
        // ============================================

        $lines = [];

        foreach ($details as $d) {

            $name = $d->item_name ?? '商品';
            $code = $d->item_number ?? '-';

            $qty = (int)($d->qty ?? $d->quantity ?? 1);
            $sub = (int)($d->amount ?? 0);
            $unit = $qty > 0 ? (int)round($sub / $qty) : 0;

            $colName = $mbPad($name, $W_NAME);
            $colCode = $mbPad($code, $W_CODE);
            $colUnit = $mbPad($yen($unit), $W_UNIT, STR_PAD_LEFT);
            $colQty  = $mbPad((string)$qty, $W_QTY, STR_PAD_BOTH);
            $colSub  = $mbPad($yen($sub), $W_SUB, STR_PAD_LEFT);

            $lines[] = $colName . $COL_GAP . $colCode . $COL_GAP . $colUnit . $COL_GAP . $colQty . $COL_GAP . $colSub;
        }

        // ============================================
        // 合計計算
        // ============================================

        $itemsSubtotal = $details->sum(fn($d) => (int)($d->amount ?? 0));
        $shipping = (int)($order->shipping_amount ?? 0);
        $fee = (int)($order->fee ?? 0);
        $grand = (int)($order->total_amount ?? $itemsSubtotal + $shipping + $fee);

        // ============================================
        // 出力組み立て
        // ============================================

        $out = [];
        $out[] = str_repeat('-', $LINE_W);
        $out[] = "■ ご注文情報";
        if ($show('order_no')) {
            $out[] = "  注文番号：{$order->order_no}";
        }
        if ($show('payment_method')) {
            $out[] = "  お支払い方法：{$order->payment_method}";
        }
        $out[] = str_repeat('-', $LINE_W);
        $out[] = "";
        $out[] = "■ ご注文商品";

        $out[] = $mbPad('商品名', $W_NAME) . $COL_GAP .
                 $mbPad('型番', $W_CODE) . $COL_GAP .
                 $mbPad('税込単価', $W_UNIT, STR_PAD_LEFT) . $COL_GAP .
                 $mbPad('注文数', $W_QTY, STR_PAD_LEFT) . $COL_GAP .
                 $mbPad('小計', $W_SUB, STR_PAD_LEFT);

        $out[] = str_repeat('-', $LINE_W);

        if (!empty($lines)) {
            foreach ($lines as $line) {
                $out[] = $line;
            }
        } else {
            $out[] = "（商品情報が取得できませんでした）";
        }

        $out[] = str_repeat('-', $LINE_W);
        $out[] = "";
        $out[] = "■ 金額内訳";
        $out[] = "お買い上げ金額(税込)  " . $yen($itemsSubtotal);
        if ($shipping !== 0) $out[] = "送料(税込)  " . $yen($shipping);
        if ($fee !== 0)      $out[] = "代引き手数料(税込)  " . $yen($fee);
        $out[] = "合計(税込)  " . $yen($grand);
        $out[] = str_repeat('-', $LINE_W);

        return implode("\n", $out);
    }
}