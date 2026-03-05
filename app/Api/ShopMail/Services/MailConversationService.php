<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class MailConversationService
{
    public function __construct(
        private EcMailHistoryService $ecMailHistoryService
    ) {}

    public function listOrderMessages(int $receiveOrderId): array
    {
        \Log::info('[ShopMail][listOrderMessages]', [
            'receive_order_id' => $receiveOrderId,
        ]);

        $q = DB::table('t_mail_messages as mm')
            ->leftJoin('t_customers as c', 'c.id', '=', 'mm.customer_id')
            ->where('mm.receive_order_id', $receiveOrderId);

        if (Schema::hasColumn('t_mail_messages', 'deleted_at')) {
            $q->whereNull('mm.deleted_at');
        }

        $rows = $q->select([
                'mm.id',
                'mm.receive_order_id',
                'mm.customer_id',
                'mm.direction',
                'mm.send_status',

                // ★ 宛先：to_email が空なら customer.email_main
                DB::raw("COALESCE(mm.to_email, c.email_main) as to_email"),

                'mm.subject',
                'mm.error_message',

                // ★ 本文（フロント互換）
                DB::raw('mm.body as body_text'),

                // ★ 送信日付のみ（YYYY-MM-DD）
                DB::raw('DATE(mm.sent_at) as created_at'),
            ])
            ->orderBy('mm.id', 'asc')
            ->get();

        \Log::info('[ShopMail][listOrderMessages][result]', [
            'count' => $rows->count(),
        ]);

        return ['rows' => $rows];
    }

    public function receiveOrderIdBySalesId(int $salesId): ?int
    {
        $id = DB::table('t_link_r_order_sales')
            ->where('sales_id', $salesId)
            ->orderByDesc('id')
            ->value('receive_order_id');

        return $id ? (int)$id : null;
    }

    public function listSalesMessages(int $salesId): array
    {
        $receiveOrderId = $this->receiveOrderIdBySalesId($salesId);
        if (!$receiveOrderId) {
            return ['rows' => [], 'receive_order_id' => null];
        }
        $ret = $this->listOrderMessages($receiveOrderId);
        $ret['receive_order_id'] = $receiveOrderId;
        return $ret;
    }

    /**
     * 問い合わせ一覧（手動ページング）
     * - rows + pager 形式に統一
     * - ★追加: is_replied (0/1) = t_inquiries_history が1件でもあるか
     */
    public function listInquiries(array $cond = []): array
    {
        $c = new Collection($cond);

        $page    = max(1, (int)($c->get('page') ?? 1));
        $perPage = max(1, (int)($c->get('per_page') ?? 20));
        $keyword = trim((string)($c->get('keyword') ?? ''));

        $q = DB::table('t_inquiries');

        if (Schema::hasColumn('t_inquiries', 'deleted_at')) {
            $q->whereNull('t_inquiries.deleted_at');
        }

        if ($c->has('is_public') && $c->get('is_public') !== '' && $c->get('is_public') !== null) {
            $q->where('is_public', (int)$c->get('is_public'));
        }
        if ($c->has('content') && trim((string)$c->get('content')) !== '') {
            $q->where('content', 'like', '%' . trim((string)$c->get('content')) . '%');
        }

        if ($keyword !== '') {
            $q->where(function ($w) use ($keyword) {
                $w->where('customer_name', 'like', "%{$keyword}%")
                  ->orWhere('email', 'like', "%{$keyword}%")
                  ->orWhere('details', 'like', "%{$keyword}%");
            });
        }

        $countQ = clone $q;
        $total = (int)$countQ->count();

        $offset = ($page - 1) * $perPage;

        $hasHistoryDeleted = Schema::hasColumn('t_inquiries_history', 'deleted_at');
        $existsSql = $hasHistoryDeleted
            ? "EXISTS (SELECT 1 FROM t_inquiries_history h WHERE h.inquiries_id = t_inquiries.id AND h.deleted_at IS NULL)"
            : "EXISTS (SELECT 1 FROM t_inquiries_history h WHERE h.inquiries_id = t_inquiries.id)";

        $rows = $q
            ->select([
                't_inquiries.*',
                DB::raw("CASE WHEN {$existsSql} THEN 1 ELSE 0 END as is_replied"),
            ])
            ->orderByDesc('id')
            ->offset($offset)
            ->limit($perPage)
            ->get();

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

    public function listInquiryMessages(int $inquiryId): array
    {
        $inqQ = DB::table('t_inquiries')->where('id', $inquiryId);
        if (Schema::hasColumn('t_inquiries', 'deleted_at')) {
            $inqQ->whereNull('t_inquiries.deleted_at');
        }
        $inq = $inqQ->first();

        $histQ = DB::table('t_inquiries_history')
            ->where('inquiries_id', $inquiryId);

        if (Schema::hasColumn('t_inquiries_history', 'deleted_at')) {
            $histQ->whereNull('t_inquiries_history.deleted_at');
        }

        $hist = $histQ->orderBy('id', 'asc')->get();

        return [
            'inquiry' => $inq,
            'rows' => $hist,
        ];
    }

    public function listEcMailHistories(array $cond = []): array
    {
        $payload = [
            'page' => $cond['page'] ?? 1,
            'per_page' => $cond['per_page'] ?? 20,
            'keyword' => $cond['keyword'] ?? ($cond['c_keyword'] ?? ''),
        ];

        return $this->ecMailHistoryService->fetch($payload);
    }
}