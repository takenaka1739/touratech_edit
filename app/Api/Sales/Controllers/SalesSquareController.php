<?php

namespace App\Api\Sales\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Base\Models\Sales;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class SalesSquareController extends Controller
{
    /**
     * Square オーソリ済み決済を「実売上（キャプチャ）」する
     */
    public function complete(int $id): JsonResponse
    {
        /** @var Sales $sale */
        $sale = Sales::findOrFail($id);

        if (!$sale->square_payment_id) {
            return response()->json(['message' => 'Square決済IDが登録されていません。'], 400);
        }

        // 既に完了している場合は何もしない（フロントから連打されても安全に）
        if ($sale->square_status === 'captured') {
            return response()->json(['message' => '既に支払い済みです。'], 200);
        }

        $env = config('services.square.env') === 'production' ? 'production' : 'sandbox';
        $baseUrl = $env === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        try {
            $url = $baseUrl . '/v2/payments/' . $sale->square_payment_id . '/complete';

            // ★ body を明示的に '{}' の JSON 文字列で送る
            $response = Http::withToken(config('services.square.token'))
                ->withHeaders([
                    'Square-Version' => '2023-12-13',
                    'Content-Type'   => 'application/json',
                ])
                ->send('POST', $url, [
                    'body' => '{}',
                ]);

            if ($response->failed()) {
                $body   = $response->json();
                $errors = $body['errors'] ?? [];
                $msg    = collect($errors)->map(fn($e) => $e['detail'] ?? 'Unknown error')->implode(' / ');

                Log::error('[SalesSquare] completePayment HTTPエラー', [
                    'sale_id'           => $sale->id,
                    'square_payment_id' => $sale->square_payment_id,
                    'status'            => $response->status(),
                    'body'              => $body,
                ]);

                return response()->json(['message' => $msg ?: 'Square決済APIエラーが発生しました。'], 400);
            }

            $payment = $response->json('payment') ?? [];

            // DB 更新：ステータス＋入金日
            $sale->square_status = 'captured';
            $sale->payment_at    = now(); // ← 管理画面で「支払い実行」したタイミング
            $sale->save();

            Log::info('[SalesSquare] completePayment 成功', [
                'sale_id'           => $sale->id,
                'square_payment_id' => $sale->square_payment_id,
                'status'            => $payment['status'] ?? null,
            ]);

            return response()->json(['message' => '支払いを実行しました。']);
        } catch (\Throwable $e) {
            Log::error('[SalesSquare] completePayment 致命的エラー', [
                'sale_id' => $sale->id,
                'error'   => $e->getMessage(),
            ]);

            return response()->json(['message' => '支払い実行中にエラーが発生しました。'], 500);
        }
    }

    /**
     * Square オーソリ済み決済をキャンセルする
     */
    public function cancel(int $id): JsonResponse
    {
        /** @var Sales $sale */
        $sale = Sales::findOrFail($id);

        if (!$sale->square_payment_id) {
            return response()->json(['message' => 'Square決済IDが登録されていません。'], 400);
        }

        // 既にキャンセル or 未オーソリなら何もしない
        if (in_array($sale->square_status, ['canceled', 'voided'], true)) {
            return response()->json(['message' => '既にキャンセル済みです。'], 200);
        }

        $env = config('services.square.env') === 'production' ? 'production' : 'sandbox';
        $baseUrl = $env === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        try {
            $url = $baseUrl . '/v2/payments/' . $sale->square_payment_id . '/cancel';

            // こちらも '{}' を送る
            $response = Http::withToken(config('services.square.token'))
                ->withHeaders([
                    'Square-Version' => '2023-12-13',
                    'Content-Type'   => 'application/json',
                ])
                ->send('POST', $url, [
                    'body' => '{}',
                ]);

            if ($response->failed()) {
                $body   = $response->json();
                $errors = $body['errors'] ?? [];
                $msg    = collect($errors)->map(fn($e) => $e['detail'] ?? 'Unknown error')->implode(' / ');

                Log::error('[SalesSquare] cancelPayment HTTPエラー', [
                    'sale_id'           => $sale->id,
                    'square_payment_id' => $sale->square_payment_id,
                    'status'            => $response->status(),
                    'body'              => $body,
                ]);

                return response()->json(['message' => $msg ?: 'Square決済APIエラーが発生しました。'], 400);
            }

            $sale->square_status = 'canceled';
            $sale->payment_at    = null;  // 入金日はクリアしておく
            $sale->save();

            Log::info('[SalesSquare] cancelPayment 成功', [
                'sale_id'           => $sale->id,
                'square_payment_id' => $sale->square_payment_id,
            ]);

            return response()->json(['message' => '決済をキャンセルしました。']);
        } catch (\Throwable $e) {
            Log::error('[SalesSquare] cancelPayment 致命的エラー', [
                'sale_id' => $sale->id,
                'error'   => $e->getMessage(),
            ]);

            return response()->json(['message' => '決済キャンセル中にエラーが発生しました。'], 500);
        }
    }
}
