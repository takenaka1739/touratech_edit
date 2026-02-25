<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Requests\SendMailRequest;
use App\Api\ShopMail\Services\MailConversationService;
use App\Api\ShopMail\Services\MailSendService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InquiryMailController extends Controller
{
    public function __construct(
        private MailConversationService $conv,
        private MailSendService $send
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cond = [
            'keyword' => $request->query('keyword', ''),
        ];
        return response()->json($this->conv->listInquiries($cond));
    }

    public function show(int $id): JsonResponse
    {
        $row = DB::table('t_inquiries')->where('id', $id)->whereNull('deleted_at')->first();
        return response()->json(['row' => $row]);
    }

    public function messages(int $id): JsonResponse
    {
        return response()->json($this->conv->listInquiryMessages($id));
    }

    public function send(int $id, SendMailRequest $request): JsonResponse
    {
        $ret = $this->send->sendInquiryMail($id, $request->validated());
        return response()->json($ret, $ret['ok'] ? 200 : 400);
    }
}
