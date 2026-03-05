<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Services\MailConversationService;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function __construct(
        private MailConversationService $service
    ) {}

    /**
     * 問い合わせ一覧
     * GET /api/shop-mail/inquiries
     * 返却: { rows: [], pager: { current_page,last_page,per_page,total } }
     */
    public function index(Request $request)
    {
        $cond = $request->only([
            'keyword',
            'is_public',
            'content',
            'page',
            'per_page',
        ]);

        $ret = $this->service->listInquiries($cond);

        return response()->json([
            'rows'  => $ret['rows'] ?? [],
            'pager' => $ret['pager'] ?? [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => (int)($cond['per_page'] ?? 20),
                'total' => count($ret['rows'] ?? []),
            ],
        ]);
    }

    public function show(int $id)
    {
        $ret = $this->service->listInquiryMessages($id);

        if (empty($ret['inquiry'])) {
            return response()->json(['message' => '問い合わせが存在しません'], 404);
        }

        return response()->json([
            'inquiry' => $ret['inquiry'],
        ]);
    }

    public function messages(int $id)
    {
        $ret = $this->service->listInquiryMessages($id);

        if (empty($ret['inquiry'])) {
            return response()->json(['message' => '問い合わせが存在しません'], 404);
        }

        return response()->json([
            'inquiry' => $ret['inquiry'],
            'rows' => $ret['rows'] ?? [],
        ]);
    }
}