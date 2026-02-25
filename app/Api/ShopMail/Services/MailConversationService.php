<?php

namespace App\Api\ShopMail\Services;

use Illuminate\Support\Facades\DB;

class MailConversationService
{
    public function listOrderMessages(int $receiveOrderId): array
    {
        $rows = DB::table('t_mail_messages')
            ->where('receive_order_id', $receiveOrderId)
            ->whereNull('deleted_at')
            ->orderBy('id', 'asc')
            ->get();

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

    public function listInquiries(array $cond = []): array
    {
        $q = DB::table('t_inquiries')->whereNull('deleted_at');

        if (!empty($cond['keyword'])) {
            $kw = trim((string)$cond['keyword']);
            $q->where(function ($w) use ($kw) {
                $w->where('customer_name', 'like', "%{$kw}%")
                  ->orWhere('email', 'like', "%{$kw}%")
                  ->orWhere('details', 'like', "%{$kw}%");
            });
        }

        $rows = $q->orderByDesc('id')->limit(200)->get();
        return ['rows' => $rows];
    }

    public function listInquiryMessages(int $inquiryId): array
    {
        $inq = DB::table('t_inquiries')->where('id', $inquiryId)->whereNull('deleted_at')->first();

        $hist = DB::table('t_inquiries_history')
            ->where('inquiries_id', $inquiryId)
            ->whereNull('deleted_at')
            ->orderBy('id', 'asc')
            ->get();

        return [
            'inquiry' => $inq,
            'rows' => $hist,
        ];
    }
}
