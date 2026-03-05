<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Requests\InquiryReplySendRequest;
use App\Api\ShopMail\Services\InquiryReplyService;
use Illuminate\Http\JsonResponse;

class InquiryReplyController extends Controller
{
    public function __construct(
        private InquiryReplyService $service
    ) {}

    /**
     * POST /api/shop-mail/inquiries/{id}/send
     * - t_inquiries_history に保存
     * - （可能なら）メール送信
     */
    public function send(InquiryReplySendRequest $request, int $id): JsonResponse
    {
        $result = $this->service->send($id, $request->validated());
        return response()->json($result);
    }
}