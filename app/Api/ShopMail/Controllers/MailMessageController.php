<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Services\MailConversationService;
use App\Api\ShopMail\Services\MailSendService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MailMessageController extends Controller
{
    public function __construct(
        private MailConversationService $conversationService,
        private MailSendService $sendService,
    ) {}

    /**
     * 受注に紐づく送信履歴
     * GET /api/shop-mail/orders/{receiveOrderId}/messages
     */
    public function orderMessages(int $receiveOrderId): JsonResponse
    {
        try {
            $ret = $this->conversationService->listOrderMessages($receiveOrderId);
            // 期待: ['rows' => [...]]
            return response()->json($ret);
        } catch (\Throwable $e) {
            Log::error('[MailMessageController][orderMessages] failed', [
                'receive_order_id' => $receiveOrderId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => '受注メール履歴の取得に失敗しました',
            ], 500);
        }
    }

    /**
     * 受注メール送信
     * POST /api/shop-mail/orders/{receiveOrderId}/send
     */
    public function sendOrderMail(int $receiveOrderId, Request $request): JsonResponse
    {
        try {
            // 既存payload差分吸収のため、ここでは丸ごと受ける（厳密バリデーションは Request クラス導入でOK）
            $payload = $request->all();

            // MailSendService 側が template_id/mail_template_id, body/body_text を吸収できるようにしている前提
            $ret = $this->sendService->sendOrderMail($receiveOrderId, $payload);

            return response()->json($ret, ($ret['ok'] ?? false) ? 200 : 422);
        } catch (\Throwable $e) {
            Log::error('[MailMessageController][sendOrderMail] failed', [
                'receive_order_id' => $receiveOrderId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => '受注メール送信に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 売上に紐づく送信履歴（売上ID→受注ID→messages）
     * GET /api/shop-mail/sales/{salesId}/messages
     */
    public function salesMessages(int $salesId): JsonResponse
    {
        try {
            $ret = $this->conversationService->listSalesMessages($salesId);
            // 期待: ['rows' => [...], 'receive_order_id' => int|null]
            return response()->json($ret);
        } catch (\Throwable $e) {
            Log::error('[MailMessageController][salesMessages] failed', [
                'sales_id' => $salesId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => '売上メール履歴の取得に失敗しました',
            ], 500);
        }
    }
}