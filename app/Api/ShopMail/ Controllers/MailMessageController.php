<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Requests\SendMailRequest;
use App\Api\ShopMail\Services\MailConversationService;
use App\Api\ShopMail\Services\MailSendService;
use Illuminate\Http\JsonResponse;

class MailMessageController extends Controller
{
    public function __construct(
        private MailConversationService $conv,
        private MailSendService $send
    ) {}

    public function orderMessages(int $receiveOrderId): JsonResponse
    {
        return response()->json($this->conv->listOrderMessages($receiveOrderId));
    }

    public function salesMessages(int $salesId): JsonResponse
    {
        return response()->json($this->conv->listSalesMessages($salesId));
    }

    public function sendOrderMail(int $receiveOrderId, SendMailRequest $request): JsonResponse
    {
        $ret = $this->send->sendOrderMail($receiveOrderId, $request->validated());
        return response()->json($ret, $ret['ok'] ? 200 : 400);
    }
}
