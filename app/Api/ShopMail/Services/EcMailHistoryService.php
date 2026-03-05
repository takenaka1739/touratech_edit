<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class EcMailHistoryService
{
    public function fetch(array $cond = []): array
    {
        $c = new Collection($cond);

        $page    = max(1, (int)($c->get('page') ?? 1));
        $perPage = max(1, (int)($c->get('per_page') ?? 20));
        $keyword = trim((string)($c->get('keyword') ?? $c->get('c_keyword') ?? ''));

        $hasSalesDeleted = Schema::hasColumn('t_sales', 'deleted_at');
        $hasMsgDeleted   = Schema::hasColumn('t_mail_messages', 'deleted_at');

        // =========================================================
        // 母集団：t_mail_messages を receive_order_id 単位で集計
        // （＝メールが存在する受注だけ）
        // =========================================================
        $mmc = DB::table('t_mail_messages')
            ->selectRaw('receive_order_id, COUNT(*) as send_count, MAX(sent_at) as last_sent_at')
            ->whereNotNull('receive_order_id')
            ->groupBy('receive_order_id');

        if ($hasMsgDeleted) {
            $mmc->whereNull('t_mail_messages.deleted_at');
        }

        // 受注→売上リンク（受注ごとに最新1件に潰す）
        $lrsLatest = DB::table('t_link_r_order_sales as lrs1')
            ->selectRaw('lrs1.receive_order_id, lrs1.sales_id')
            ->join(
                DB::raw('(select receive_order_id, MAX(id) as max_id from t_link_r_order_sales group by receive_order_id) as lrs2'),
                function ($j) {
                    $j->on('lrs2.receive_order_id', '=', 'lrs1.receive_order_id')
                      ->on('lrs2.max_id', '=', 'lrs1.id');
                }
            );

        // 支払いJOIN列の解決（環境差吸収）
        $paymentIdCol = null;
        foreach (['payment_id', 'm_payment_id'] as $col) {
            if (Schema::hasColumn('t_receive_orders', $col)) {
                $paymentIdCol = $col;
                break;
            }
        }

        // 端末判定用の列候補
        $hasIsMobile   = Schema::hasColumn('t_receive_orders', 'is_mobile');
        $hasDeviceType = Schema::hasColumn('t_receive_orders', 'device_type');
        $hasDevice     = Schema::hasColumn('t_receive_orders', 'device');
        $hasUserAgent  = Schema::hasColumn('t_receive_orders', 'user_agent');

        // 端末の SQL expression（取れる情報に応じて作る）
        $deviceExpr = "'（不明）'";
        if ($hasIsMobile) {
            // 0/1想定
            // NOTE: 仕様の sales_form とは別。旧互換で sale_type を返す用途。
            $deviceExpr = "CASE WHEN ro.is_mobile = 1 THEN 'スマフォ' ELSE 'PC' END";
        } elseif ($hasDeviceType) {
            $deviceExpr = "CASE
                WHEN ro.device_type IN ('sp','SP','mobile','Mobile','smartphone','Smartphone', '1', 1, '2', 2) THEN 'スマフォ'
                WHEN ro.device_type IN ('pc','PC','desktop','Desktop', '0', 0) THEN 'PC'
                ELSE '（不明）'
            END";
        } elseif ($hasDevice) {
            $deviceExpr = "CASE
                WHEN ro.device like '%sp%' OR ro.device like '%SP%' OR ro.device like '%mobile%' OR ro.device like '%Mobile%' THEN 'スマフォ'
                ELSE 'PC'
            END";
        } elseif ($hasUserAgent) {
            $deviceExpr = "CASE
                WHEN ro.user_agent like '%Mobile%' OR ro.user_agent like '%Android%' OR ro.user_agent like '%iPhone%' OR ro.user_agent like '%iPad%' THEN 'スマフォ'
                ELSE 'PC'
            END";
        }

        // =========================================================
        // ベース：mmc（=メール有り受注） → ro → lrs → s → payments
        // =========================================================
        $q = DB::table(DB::raw('(' . $mmc->toSql() . ') as mmc'))
            ->mergeBindings($mmc)
            ->join('t_receive_orders as ro', 'ro.id', '=', 'mmc.receive_order_id')
            ->leftJoinSub($lrsLatest, 'lrs', function ($j) {
                $j->on('lrs.receive_order_id', '=', 'ro.id');
            })
            ->leftJoin('t_sales as s', function ($j) use ($hasSalesDeleted) {
                $j->on('s.id', '=', 'lrs.sales_id');
                if ($hasSalesDeleted) {
                    $j->whereNull('s.deleted_at');
                }
            });

        // 支払マスタ（payment_id がある環境だけ JOIN）
        if ($paymentIdCol) {
            $q->leftJoin('m_payments as pay', 'pay.id', '=', DB::raw("ro.{$paymentIdCol}"));
        }

        // 検索（ro側）
        if ($keyword !== '') {
            $q->where(function ($w) use ($keyword) {
                $w->where('ro.customer_name', 'like', "%{$keyword}%")
                  ->orWhere('ro.order_no', 'like', "%{$keyword}%")
                  ->orWhere('ro.email', 'like', "%{$keyword}%");
            });
        }

        // =========================
        // ★ 手動ページング
        // =========================
        $countQ = clone $q;
        $total = (int)$countQ->count();

        $offset = ($page - 1) * $perPage;

        // 返却列
        $q->select([
            DB::raw('ro.id as receive_order_id'),
            DB::raw('s.id as sales_id'),
            DB::raw('ro.order_no as slip_no'),
            DB::raw('ro.total_amount as total_amount'),
            DB::raw('ro.receive_order_date as invoice_date'),
            DB::raw('null as paid_date'),
            DB::raw('ro.customer_name as member_name'),
            DB::raw('ro.customer_name as buyer_name'),

            // ★★★ 追加：売上形態（仕様の本命）
            // 1=PC,2=スマフォ,3=タブレット（フロントで salesFormLabel() 変換）
            DB::raw('ro.sales_form as sales_form'),

            // ★ 支払種別：m_payments.name（取れない環境は従来値にフォールバック）
            $paymentIdCol
                ? DB::raw('pay.name as payment_name')
                : DB::raw('null as payment_name'),

            // 旧: payment_type（残すなら corporate_class を返しておく）
            DB::raw('ro.corporate_class as payment_type'),

            DB::raw('ro.delivery_date as shipped_date'),
            DB::raw('null as canceled_date'),
            DB::raw('mmc.send_count as send_count'),

            // 旧互換: 端末推定（sales_form とは別物）
            DB::raw("{$deviceExpr} as sale_type"),

            // ★ 状態（受注/売上）は別名で返す
            DB::raw("CASE WHEN lrs.sales_id is null THEN '受注' ELSE '売上' END as order_state"),

            DB::raw("'' as status"),
            DB::raw('mmc.last_sent_at as last_sent_at'),
        ]);

        // 並び：最新送信日時 → 受注ID
        $q->orderByDesc('mmc.last_sent_at')
          ->orderByDesc('ro.id')
          ->offset($offset)
          ->limit($perPage);

        $rows = $q->get();

        $lastPage = (int)max(1, (int)ceil($total / $perPage));

        Log::info('[EcMailHistoryService][fetch][manual_pager]', [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'data_count' => $rows->count(),
            'last_page' => $lastPage,
            'offset' => $offset,
            'keyword' => $keyword,
            'paymentIdCol' => $paymentIdCol,
            'device_source' => [
                'is_mobile' => $hasIsMobile,
                'device_type' => $hasDeviceType,
                'device' => $hasDevice,
                'user_agent' => $hasUserAgent,
            ],
        ]);

        return [
            'rows' => $rows,
            'pager' => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'per_page'     => $perPage,
                'total'        => $total,
            ],
        ];
    }
}