<?php

namespace App\Api\ReceiveOrder\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Base\Models\ReceiveOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ReceiveOrderSquareController extends Controller
{
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
}
