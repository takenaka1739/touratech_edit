<?php

namespace App\Api\ReceiveOrder\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Base\Models\CustomerPayment;
use App\Base\Models\ReceiveOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ReceiveOrderSquareController extends Controller
{
    /**
     * 保存済みカードで後日決済を実行する
     */
    public function charge(int $id): JsonResponse
    {
        /** @var ReceiveOrder $order */
        $order = ReceiveOrder::findOrFail($id);

        if ($order->square_payment_flow !== 'card_on_file') {
            return response()->json([
                'success' => false,
                'message' => '後日カード決済の受注ではありません。',
            ], 400);
        }

        if ($order->square_payment_status === 'charged' || $order->square_status === 'captured') {
            return response()->json([
                'success' => true,
                'message' => '既に支払い済みです。',
                'data' => $this->responseData($order),
            ]);
        }

        if (!$order->customer_payment_id) {
            return response()->json([
                'success' => false,
                'message' => '保存カード情報が受注に紐づいていません。',
            ], 400);
        }

        $payment = CustomerPayment::where('id', $order->customer_payment_id)
            ->where('method_code', 'card')
            ->first();

        if (!$payment || !$payment->square_customer_id || !$payment->card_id) {
            return response()->json([
                'success' => false,
                'message' => 'Square決済に必要な保存カード情報が不足しています。',
            ], 400);
        }

        $amount = (int)round((float)($order->total_amount ?? 0));
        if ($amount <= 0) {
            return response()->json([
                'success' => false,
                'message' => '請求金額が0円以下のため、カード決済を実行できません。',
            ], 400);
        }

        $locationId = (string)config('services.square.location_id');
        if ($locationId === '') {
            return response()->json([
                'success' => false,
                'message' => 'SquareロケーションIDが設定されていません。',
            ], 500);
        }

        if (!config('services.square.token')) {
            return response()->json([
                'success' => false,
                'message' => 'Squareアクセストークンが設定されていません。',
            ], 500);
        }

        $idempotencyKey = (string)Str::uuid();
        $attemptId = DB::table('t_receive_order_square_payment_attempts')->insertGetId([
            'receive_order_id' => $order->id,
            'customer_payment_id' => $payment->id,
            'amount' => $amount,
            'currency' => 'JPY',
            'idempotency_key' => $idempotencyKey,
            'attempted_by' => Auth::id(),
            'attempted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $env = config('services.square.env') === 'production' ? 'production' : 'sandbox';
        $baseUrl = $env === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        try {
            $response = Http::withToken(config('services.square.token'))
                ->withHeaders([
                    'Square-Version' => '2023-12-13',
                    'Content-Type' => 'application/json',
                ])
                ->post($baseUrl . '/v2/payments', [
                    'source_id' => $payment->card_id,
                    'idempotency_key' => $idempotencyKey,
                    'amount_money' => [
                        'amount' => $amount,
                        'currency' => 'JPY',
                    ],
                    'autocomplete' => true,
                    'customer_id' => $payment->square_customer_id,
                    'location_id' => $locationId,
                    'reference_id' => (string)($order->order_no ?: $order->id),
                    'note' => 'ReceiveOrder #' . $order->id,
                ]);

            $body = $response->json();
            if ($response->failed()) {
                $message = $this->squareErrorMessage($body);
                $code = $this->squareErrorCode($body);

                DB::table('t_receive_order_square_payment_attempts')
                    ->where('id', $attemptId)
                    ->update([
                        'square_status' => 'failed',
                        'error_code' => $code,
                        'error_message' => $message,
                        'updated_at' => now(),
                    ]);

                $order->square_payment_status = 'failed';
                $order->square_payment_requested_at = now();
                $order->square_payment_failed_at = now();
                $order->square_payment_error = $message;
                $order->save();

                Log::error('[ReceiveOrderSquare] card_on_file charge HTTPエラー', [
                    'receive_order_id' => $order->id,
                    'status' => $response->status(),
                    'body' => $body,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $message ?: 'Square決済APIエラーが発生しました。',
                    'data' => $this->responseData($order),
                ], 400);
            }

            $squarePayment = $body['payment'] ?? [];
            $squarePaymentId = (string)($squarePayment['id'] ?? '');
            $squareStatus = (string)($squarePayment['status'] ?? 'COMPLETED');

            DB::table('t_receive_order_square_payment_attempts')
                ->where('id', $attemptId)
                ->update([
                    'square_payment_id' => $squarePaymentId ?: null,
                    'square_status' => $squareStatus ?: null,
                    'updated_at' => now(),
                ]);

            $timestamp = now()->format('Y-m-d H:i');
            $order->remarks = trim(($order->remarks ?? '') . "/クレジット支払い実行（{$timestamp}）");
            $order->square_payment_id = $squarePaymentId ?: $order->square_payment_id;
            $order->square_status = 'captured';
            $order->square_payment_status = 'charged';
            $order->square_payment_requested_at = now();
            $order->square_payment_captured_at = now();
            $order->square_payment_failed_at = null;
            $order->square_payment_error = null;
            $order->save();

            Log::info('[ReceiveOrderSquare] card_on_file charge 成功', [
                'receive_order_id' => $order->id,
                'square_payment_id' => $order->square_payment_id,
                'square_status' => $squareStatus,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'カード決済を実行しました。',
                'data' => $this->responseData($order),
            ]);
        } catch (\Throwable $e) {
            DB::table('t_receive_order_square_payment_attempts')
                ->where('id', $attemptId)
                ->update([
                    'square_status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'updated_at' => now(),
                ]);

            $order->square_payment_status = 'failed';
            $order->square_payment_requested_at = now();
            $order->square_payment_failed_at = now();
            $order->square_payment_error = $e->getMessage();
            $order->save();

            Log::error('[ReceiveOrderSquare] card_on_file charge 致命的エラー', [
                'receive_order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'カード決済実行中にエラーが発生しました。',
                'data' => $this->responseData($order),
            ], 500);
        }
    }

    /**
     * Square オーソリ済み決済を「実売上（キャプチャ）」する
     */
    public function complete(int $id): JsonResponse
    {
        /** @var ReceiveOrder $order */
        $order = ReceiveOrder::findOrFail($id);

        if (!$order->square_payment_id) {
            // 互換: message は維持 + success を追加
            return response()->json([
                'success' => false,
                'message' => 'Square決済IDが登録されていません。',
            ], 400);
        }

        // 既に支払い済み（= captured）
        if ($order->square_status === 'captured') {
            // 互換: 200 のまま + success を追加（フロントが success 判定でも通る）
            return response()->json([
                'success' => true,
                'message' => '既に支払い済みです。',
            ], 200);
        }

        $env = config('services.square.env') === 'production' ? 'production' : 'sandbox';
        $baseUrl = $env === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        try {
            $url = $baseUrl . '/v2/payments/' . $order->square_payment_id . '/complete';

            $response = Http::withToken(config('services.square.token'))
                ->withHeaders([
                    'Square-Version' => '2023-12-13',
                    'Content-Type'   => 'application/json',
                ])
                ->send('POST', $url, ['body' => '{}']);

            if ($response->failed()) {
                $body = $response->json();
                $msg = collect($body['errors'] ?? [])
                    ->map(fn($e) => $e['detail'] ?? 'Unknown error')
                    ->implode(' / ');

                Log::error('[ReceiveOrderSquare] completePayment HTTPエラー', [
                    'receive_order_id'  => $order->id,
                    'square_payment_id' => $order->square_payment_id,
                    'status'            => $response->status(),
                    'body'              => $body,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $msg ?: 'Square決済APIエラーが発生しました。',
                    // デバッグで見たい場合に備えて最低限の情報を返す（互換のため追加しても壊れにくい）
                    'data'    => [
                        'square_status' => $order->square_status,
                    ],
                ], 400);
            }

            // ▼▼ remarks に履歴を追記 ▼▼
            $timestamp = now()->format('Y-m-d H:i');
            $appendMsg = "/クレジット支払い実行（{$timestamp}）";

            $order->remarks = trim(($order->remarks ?? '') . $appendMsg);
            $order->square_status = 'captured';
            $order->save();

            Log::info('[ReceiveOrderSquare] completePayment 成功', [
                'receive_order_id'  => $order->id,
                'square_payment_id' => $order->square_payment_id,
            ]);

            // 互換: message は維持 + success/data を追加
            return response()->json([
                'success' => true,
                'message' => '支払いを実行しました。',
                'data'    => [
                    'receive_order_id'  => $order->id,
                    'square_payment_id' => $order->square_payment_id,
                    'square_status'     => $order->square_status, // captured
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('[ReceiveOrderSquare] completePayment 致命的エラー', [
                'receive_order_id' => $order->id ?? $id,
                'error'            => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '支払い実行中にエラーが発生しました。',
            ], 500);
        }
    }

    /**
     * Square オーソリ済み決済をキャンセルする
     */
    public function cancel(int $id): JsonResponse
    {
        /** @var ReceiveOrder $order */
        $order = ReceiveOrder::findOrFail($id);

        if (!$order->square_payment_id) {
            return response()->json([
                'success' => false,
                'message' => 'Square決済IDが登録されていません。',
            ], 400);
        }

        // canceled / voided はキャンセル済み扱い（旧挙動を維持）
        if (in_array($order->square_status, ['canceled', 'voided'], true)) {
            return response()->json([
                'success' => true,
                'message' => '既にキャンセル済みです。',
                'data'    => [
                    'receive_order_id'  => $order->id,
                    'square_payment_id' => $order->square_payment_id,
                    'square_status'     => $order->square_status,
                ],
            ], 200);
        }

        $env = config('services.square.env') === 'production' ? 'production' : 'sandbox';
        $baseUrl = $env === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        try {
            $url = $baseUrl . '/v2/payments/' . $order->square_payment_id . '/cancel';

            $response = Http::withToken(config('services.square.token'))
                ->withHeaders([
                    'Square-Version' => '2023-12-13',
                    'Content-Type'   => 'application/json',
                ])
                ->send('POST', $url, ['body' => '{}']);

            if ($response->failed()) {
                $body = $response->json();
                $msg = collect($body['errors'] ?? [])
                    ->map(fn($e) => $e['detail'] ?? 'Unknown error')
                    ->implode(' / ');

                Log::error('[ReceiveOrderSquare] cancelPayment HTTPエラー', [
                    'receive_order_id'  => $order->id,
                    'square_payment_id' => $order->square_payment_id,
                    'status'            => $response->status(),
                    'body'              => $body,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $msg ?: 'Square決済APIエラーが発生しました。',
                    'data'    => [
                        'square_status' => $order->square_status,
                    ],
                ], 400);
            }

            // ▼▼ remarks に履歴を追記 ▼▼
            $timestamp = now()->format('Y-m-d H:i');
            $appendMsg = "/クレジット支払いキャンセル（{$timestamp}）";

            $order->remarks = trim(($order->remarks ?? '') . $appendMsg);
            $order->square_status = 'canceled';
            $order->save();

            Log::info('[ReceiveOrderSquare] cancelPayment 成功', [
                'receive_order_id'  => $order->id,
                'square_payment_id' => $order->square_payment_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => '決済をキャンセルしました。',
                'data'    => [
                    'receive_order_id'  => $order->id,
                    'square_payment_id' => $order->square_payment_id,
                    'square_status'     => $order->square_status, // canceled
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('[ReceiveOrderSquare] cancelPayment 致命的エラー', [
                'receive_order_id' => $order->id ?? $id,
                'error'            => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '決済キャンセル中にエラーが発生しました。',
            ], 500);
        }
    }

    private function responseData(ReceiveOrder $order): array
    {
        return [
            'receive_order_id' => $order->id,
            'square_payment_id' => $order->square_payment_id,
            'square_status' => $order->square_status,
            'square_payment_flow' => $order->square_payment_flow,
            'square_payment_status' => $order->square_payment_status,
            'square_payment_error' => $order->square_payment_error,
        ];
    }

    private function squareErrorMessage(?array $body): string
    {
        return collect($body['errors'] ?? [])
            ->map(fn($e) => $e['detail'] ?? $e['code'] ?? 'Unknown error')
            ->filter()
            ->implode(' / ');
    }

    private function squareErrorCode(?array $body): ?string
    {
        $first = collect($body['errors'] ?? [])->first();
        return is_array($first) ? ($first['code'] ?? null) : null;
    }
}
