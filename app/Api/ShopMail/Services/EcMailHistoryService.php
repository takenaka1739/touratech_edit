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
        $hasCustomerId   = Schema::hasColumn('t_receive_orders', 'customer_id');
        $hasCustomerMail = Schema::hasColumn('t_customers', 'email_main');
        $hasSalesIsSend  = Schema::hasColumn('t_sales', 'is_send');
        $hasShippedAt    = Schema::hasColumn('t_sales', 'shipped_at');
        $hasInvoiceNo    = Schema::hasColumn('t_sales', 'invoice_number');
        $hasSendStatus   = Schema::hasColumn('t_mail_messages', 'send_status');
        $hasReceiveOrderCreatedAt = Schema::hasColumn('t_receive_orders', 'created_at');
        $hasReceiveOrderName = Schema::hasColumn('t_receive_orders', 'name');
        $hasReceiveOrderEmail = Schema::hasColumn('t_receive_orders', 'email');
        $hasReceiveOrderAddress1 = Schema::hasColumn('t_receive_orders', 'address1');
        $hasReceiveOrderAddress2 = Schema::hasColumn('t_receive_orders', 'address2');

        $buyerNameExpr = $hasReceiveOrderName
            ? "COALESCE(NULLIF(ro.name, ''), NULLIF(ro.customer_name, ''), ro.customer_name)"
            : 'ro.customer_name';
        $buyerAddressParts = array_values(array_filter([
            $hasReceiveOrderAddress1 ? "NULLIF(ro.address1, '')" : null,
            $hasReceiveOrderAddress2 ? "NULLIF(ro.address2, '')" : null,
        ]));
        $buyerAddressExpr = !empty($buyerAddressParts)
            ? "COALESCE(CONCAT_WS(' ', " . implode(', ', $buyerAddressParts) . "), '')"
            : "''";
        $buyerEmailExpr = $hasReceiveOrderEmail
            ? (
                $hasCustomerId && $hasCustomerMail
                    ? "COALESCE(NULLIF(ro.email, ''), cu.email_main)"
                    : 'ro.email'
            )
            : (
                $hasCustomerId && $hasCustomerMail
                    ? 'cu.email_main'
                    : 'null'
            );

        // =========================================================
        // 母集団：t_mail_messages を receive_order_id 単位で集計
        // - send_count: 総送信件数
        // - success_send_count: send_status=1 の件数
        //   1通目は自動送信のため、2件以上で「個別返信メール送信済み」
        // =========================================================
        $successSendCase = $hasSendStatus
            ? 'SUM(CASE WHEN send_status = 1 THEN 1 ELSE 0 END)'
            : 'COUNT(*)';

        $mmc = DB::table('t_mail_messages')
            ->selectRaw("
                receive_order_id,
                COUNT(*) as send_count,
                {$successSendCase} as success_send_count,
                MAX(sent_at) as last_sent_at
            ")
            ->whereNotNull('receive_order_id')
            ->groupBy('receive_order_id');

        if ($hasMsgDeleted) {
            $mmc->whereNull('t_mail_messages.deleted_at');
        }

        // 受注→売上リンク
        $lrsLatest = DB::table('t_link_r_order_sales as lrs1')
            ->selectRaw('lrs1.receive_order_id, lrs1.sales_id')
            ->join(
                DB::raw('(select receive_order_id, MAX(id) as max_id from t_link_r_order_sales group by receive_order_id) as lrs2'),
                function ($j) {
                    $j->on('lrs2.receive_order_id', '=', 'lrs1.receive_order_id')
                      ->on('lrs2.max_id', '=', 'lrs1.id');
                }
            );

        $paymentIdCol = null;

            if (Schema::hasColumn('t_receive_orders', 'm_payment_id')) {
                $paymentIdCol = 'm_payment_id';
            } elseif (Schema::hasColumn('t_receive_orders', 'payment_id')) {
                $paymentIdCol = 'payment_id';
            }

        // =========================================================
        // ベースクエリ
        // =========================================================
        $q = DB::table(DB::raw('(' . $mmc->toSql() . ') as mmc'))
            ->mergeBindings($mmc)
            ->join('t_receive_orders as ro', 'ro.id', '=', 'mmc.receive_order_id')
            ->leftJoinSub($lrsLatest, 'lrs', function ($j) {
                $j->on('lrs.receive_order_id', '=', 'ro.id');
            })
            ->leftJoin('t_sales as s', function ($j) {
                $j->on('s.id', '=', 'lrs.sales_id');
            });

        if ($hasCustomerId && $hasCustomerMail) {
            $q->leftJoin('t_customers as cu', 'cu.id', '=', 'ro.customer_id');
        }

        if ($paymentIdCol) {
            $q->leftJoin('m_payments as pay', 'pay.id', '=', DB::raw("ro.{$paymentIdCol}"));
        }

        // =========================================================
        // キーワード検索
        // =========================================================
        if ($keyword !== '') {
            $q->where(function ($w) use ($keyword, $hasCustomerId, $hasCustomerMail, $hasInvoiceNo, $hasReceiveOrderName, $hasReceiveOrderEmail, $hasReceiveOrderAddress1, $hasReceiveOrderAddress2) {
                $w->where('ro.customer_name', 'like', "%{$keyword}%")
                  ->orWhere('ro.tel', 'like', "%{$keyword}%");

                if ($hasReceiveOrderName) {
                    $w->orWhere('ro.name', 'like', "%{$keyword}%");
                }

                if ($hasReceiveOrderAddress1) {
                    $w->orWhere('ro.address1', 'like', "%{$keyword}%");
                }

                if ($hasReceiveOrderAddress2) {
                    $w->orWhere('ro.address2', 'like', "%{$keyword}%");
                }

                if ($hasCustomerId && $hasCustomerMail) {
                    $w->orWhere('cu.email_main', 'like', "%{$keyword}%");
                }

                if ($hasReceiveOrderEmail) {
                    $w->orWhere('ro.email', 'like', "%{$keyword}%");
                }

                if ($hasInvoiceNo) {
                    $w->orWhere('s.invoice_number', 'like', "%{$keyword}%");
                } else {
                    $w->orWhere('ro.order_no', 'like', "%{$keyword}%");
                }
            });
        }

        // =========================================================
        // 追加検索条件
        // =========================================================

        if ($c->get('slip_no')) {
            if ($hasInvoiceNo) {
                $q->where('s.invoice_number', 'like', '%' . $c->get('slip_no') . '%');
            } else {
                $q->where('ro.order_no', 'like', '%' . $c->get('slip_no') . '%');
            }
        }

        if ($c->get('buyer_name')) {
            $nameKeyword = '%' . $c->get('buyer_name') . '%';
            $q->where(function ($w) use ($nameKeyword, $hasReceiveOrderName) {
                $w->where('ro.customer_name', 'like', $nameKeyword);
                if ($hasReceiveOrderName) {
                    $w->orWhere('ro.name', 'like', $nameKeyword);
                }
            });
        }

        if ($c->get('buyer_email')) {
            if (($hasCustomerId && $hasCustomerMail) || $hasReceiveOrderEmail) {
                $emailKeyword = '%' . $c->get('buyer_email') . '%';
                $q->where(function ($w) use ($emailKeyword, $hasCustomerId, $hasCustomerMail, $hasReceiveOrderEmail) {
                    if ($hasCustomerId && $hasCustomerMail) {
                        $w->where('cu.email_main', 'like', $emailKeyword);
                    }
                    if ($hasReceiveOrderEmail) {
                        $method = $hasCustomerId && $hasCustomerMail ? 'orWhere' : 'where';
                        $w->{$method}('ro.email', 'like', $emailKeyword);
                    }
                });
            } else {
                $q->whereRaw('1 = 0');
            }
        }

        if ($c->get('buyer_tel')) {
            $q->where('ro.tel', 'like', '%' . $c->get('buyer_tel') . '%');
        }

        if ($c->get('sales_form') !== null && $c->get('sales_form') !== '') {
            $q->where('ro.sales_form', $c->get('sales_form'));
        }

        if ($c->get('invoice_date_from')) {
            $q->whereDate('ro.receive_order_date', '>=', $c->get('invoice_date_from'));
        }

        if ($c->get('invoice_date_to')) {
            $q->whereDate('ro.receive_order_date', '<=', $c->get('invoice_date_to'));
        }

        if ($c->get('paid_date_from')) {
            $q->whereDate('s.payment_at', '>=', $c->get('paid_date_from'));
        }

        if ($c->get('paid_date_to')) {
            $q->whereDate('s.payment_at', '<=', $c->get('paid_date_to'));
        }

        if ($c->get('shipped_date_from')) {
            if ($hasShippedAt) {
                $q->whereDate('s.shipped_at', '>=', $c->get('shipped_date_from'));
            }
        }

        if ($c->get('shipped_date_to')) {
            if ($hasShippedAt) {
                $q->whereDate('s.shipped_at', '<=', $c->get('shipped_date_to'));
            }
        }

        if ($c->get('total_amount_min') !== null && $c->get('total_amount_min') !== '') {
            $q->where('ro.total_amount', '>=', $c->get('total_amount_min'));
        }

        if ($c->get('total_amount_max') !== null && $c->get('total_amount_max') !== '') {
            $q->where('ro.total_amount', '<=', $c->get('total_amount_max'));
        }

        if ($c->get('shipped_status') !== null && $c->get('shipped_status') !== '') {
            if ($hasSalesIsSend) {
                if ((string)$c->get('shipped_status') === '1') {
                    $q->where('s.is_send', 1);
                } else {
                    $q->where(function ($w) {
                        $w->whereNull('s.is_send')
                          ->orWhere('s.is_send', 0);
                    });
                }
            }
        }

        if ($c->get('payment_type') !== null && $c->get('payment_type') !== '') {
            if ($paymentIdCol) {
                $q->where("ro.{$paymentIdCol}", $c->get('payment_type'));
            }
        }

        if ($c->get('paid_status') !== null && $c->get('paid_status') !== '') {
            if ((string)$c->get('paid_status') === '1') {
                $q->whereNotNull('s.payment_at');
            } else {
                $q->whereNull('s.payment_at');
            }
        }

        if ($c->get('reply_mail_status') !== null && $c->get('reply_mail_status') !== '') {
            if ((string)$c->get('reply_mail_status') === '1') {
                $q->where('mmc.success_send_count', '>=', 2);
            } else {
                $q->where('mmc.success_send_count', '<', 2);
            }
        }

        if ($c->get('cancel_status') !== null && $c->get('cancel_status') !== '') {
            if (!$hasSalesDeleted) {
                $q->whereRaw('1 = 0');
            } elseif ((string)$c->get('cancel_status') === '1') {
                $q->whereNotNull('s.deleted_at');
            } else {
                $q->whereNull('s.deleted_at');
            }
        }

        if ($c->get('order_state')) {
            if ($c->get('order_state') === '受注') {
                $q->whereNull('lrs.sales_id');
            }
            if ($c->get('order_state') === '売上') {
                $q->whereNotNull('lrs.sales_id');
            }
        }

        // 重複対策
        $q->groupBy([
            'ro.id',
            's.id',
            's.payment_at',
            'ro.customer_name',
            'ro.sales_form',
            'ro.total_amount',
            'ro.receive_order_date',
            'mmc.send_count',
            'mmc.success_send_count',
            'mmc.last_sent_at',
            'lrs.sales_id',
        ]);

        if ($hasReceiveOrderCreatedAt) {
            $q->groupBy('ro.created_at');
        }

        if ($hasReceiveOrderName) {
            $q->groupBy('ro.name');
        }

        if ($hasReceiveOrderEmail) {
            $q->groupBy('ro.email');
        }

        if ($hasReceiveOrderAddress1) {
            $q->groupBy('ro.address1');
        }

        if ($hasReceiveOrderAddress2) {
            $q->groupBy('ro.address2');
        }

        if ($hasCustomerId && $hasCustomerMail) {
            $q->groupBy('cu.email_main');
        }

        if ($paymentIdCol) {
            $q->groupBy('pay.name');
        }

        if ($hasInvoiceNo) {
            $q->groupBy('s.invoice_number');
        }

        if ($hasShippedAt) {
            $q->groupBy('s.shipped_at');
        }

        if ($hasSalesDeleted) {
            $q->groupBy('s.deleted_at');
        }

        if ($hasSalesIsSend) {
            $q->groupBy('s.is_send');
        }

        // =========================================================
        // ページング
        // =========================================================

        $countQ = clone $q;
        $total = (int)$countQ->get()->count();

        $offset = ($page - 1) * $perPage;

        $selects = [
            DB::raw('ro.id as receive_order_id'),
            DB::raw('s.id as sales_id'),
            $hasInvoiceNo
                ? DB::raw('s.invoice_number as slip_no')
                : DB::raw('ro.order_no as slip_no'),
            DB::raw('ro.total_amount as total_amount'),
            DB::raw('ro.receive_order_date as invoice_date'),
            $hasReceiveOrderCreatedAt
                ? DB::raw('ro.created_at as receive_order_created_at')
                : DB::raw('null as receive_order_created_at'),
            DB::raw('s.payment_at as paid_date'),
            DB::raw('ro.customer_name as member_name'),
            DB::raw("{$buyerNameExpr} as buyer_name"),
            DB::raw("{$buyerAddressExpr} as buyer_address"),
            DB::raw('ro.sales_form as sales_form'),

            $paymentIdCol
                ? DB::raw('pay.name as payment_name')
                : DB::raw('null as payment_name'),

            DB::raw("{$buyerEmailExpr} as buyer_email"),

            DB::raw('ro.tel as buyer_tel'),

            $hasShippedAt
                ? DB::raw('s.shipped_at as shipped_date')
                : DB::raw('null as shipped_date'),

            $hasSalesDeleted
                ? DB::raw('s.deleted_at as canceled_date')
                : DB::raw('null as canceled_date'),

            DB::raw('mmc.send_count as send_count'),
            DB::raw('mmc.success_send_count as success_send_count'),
            DB::raw("CASE WHEN mmc.success_send_count >= 2 THEN 1 ELSE 0 END as reply_mail_sent"),
            DB::raw("CASE WHEN lrs.sales_id is null THEN '受注' ELSE '売上' END as order_state"),
            DB::raw('mmc.last_sent_at as last_sent_at'),

            $hasSalesIsSend
                ? DB::raw('s.is_send as shipped_status')
                : DB::raw('null as shipped_status'),

            DB::raw('s.payment_at as payment_type'),
        ];

        $q->select($selects);

        if ($hasReceiveOrderCreatedAt) {
            $q->orderByDesc(DB::raw('COALESCE(mmc.last_sent_at, ro.created_at)'));
        } else {
            $q->orderByDesc('mmc.last_sent_at');
        }

        $q->orderByDesc('ro.id')
            ->offset($offset)
            ->limit($perPage);

        $rows = $q->get();

        $lastPage = (int)max(1, (int)ceil($total / $perPage));

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
