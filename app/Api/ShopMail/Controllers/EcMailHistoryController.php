<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Services\EcMailHistoryService;
use Illuminate\Http\Request;

class EcMailHistoryController extends Controller
{
    public function __construct(
        private EcMailHistoryService $service
    ) {}

    /**
     * EC購入メール履歴（一覧）
     * GET /api/shop-mail/ec-mail-histories
     */
    public function index(Request $request)
    {
        $cond = $request->only([
            'keyword',
            'c_keyword',
            'page',
            'per_page',

            'sales_form',
            'buyer_name',
            'buyer_email',
            'shipped_status',
            'buyer_tel',
            'invoice_date_from',
            'invoice_date_to',
            'paid_date_from',
            'paid_date_to',
            'shipped_date_from',
            'shipped_date_to',
            'slip_no',
            'total_amount_min',
            'total_amount_max',
            'payment_type',
            'paid_status',
            'reply_mail_status',
            'cancel_status',
            'order_state',
        ]);

        return response()->json(
            $this->service->fetch($cond)
        );
    }
}