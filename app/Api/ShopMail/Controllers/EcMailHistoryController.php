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
        ]);

        return response()->json(
            $this->service->fetch($cond)
        );
    }
}