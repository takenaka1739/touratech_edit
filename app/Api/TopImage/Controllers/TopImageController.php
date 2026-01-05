<?php

namespace App\Api\TopImage\Controllers;

use App\Api\TopImage\Services\TopImageService;
use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class TopImageController extends BaseController
{
    protected TopImageService $service;

    public function __construct(TopImageService $service)
    {
        $this->service = $service;
    }

    /**
     * 一覧取得
     */
    public function index()
    {
        $this->logIncoming('[TopImage][index]');
        try {
            $res = $this->service->getList();
            Log::info('[TopImage][index] service ok', ['summary' => $this->summarize($res)]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][index] service error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * 一括同期
     */
    public function sync(Request $request)
    {
        $this->logIncoming('[TopImage][sync]', $request);

        $items = $request->input('items', []);

        Log::info('[TopImage][sync] parsed items', [
            'type'   => gettype($items),
            'count'  => is_array($items) ? count($items) : null,
            'keys0'  => (is_array($items) && count($items) > 0 && is_array($items[0])) ? array_keys($items[0]) : null,
            'sample' => (is_array($items) ? array_map(
                fn ($i) => is_array($i) ? Arr::only($i, ['id','image_id','url','is_published']) : $i,
                array_slice($items, 0, 5)
            ) : null),
        ]);

        try {
            $res = $this->service->sync($items);
            Log::info('[TopImage][sync] service ok', [
                'summary' => $this->summarize($res),
            ]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][sync] service error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    // -------------------------
    // 共通：受信ログユーティリティ
    // -------------------------
    private function logIncoming(string $prefix, ?Request $request = null, array $extra = []): void
    {
        $req = $request ?? request();

        $raw = null;
        try { $raw = file_get_contents('php://input'); } catch (\Throwable $e) {}

        $headers = [];
        foreach ($req->headers->all() as $k => $vals) {
            if (in_array(strtolower($k), ['cookie','authorization'])) continue;
            $headers[$k] = is_array($vals) ? implode(', ', $vals) : $vals;
        }

        Log::info($prefix.' incoming', $extra + [
            'method'        => $req->getMethod(),
            'uri'           => $req->getRequestUri(),
            'content_type'  => $req->header('Content-Type'),
            'content_length'=> $req->header('Content-Length'),
            'query'         => $req->query(),
            'all'           => $req->all(),
            'raw_head'      => $this->truncate($raw, 2000),
            'headers'       => $headers,
        ]);
    }

    private function truncate(?string $s, int $max): ?string
    {
        if ($s === null) return null;
        return mb_strlen($s) > $max ? (mb_substr($s, 0, $max).'... (truncated)') : $s;
    }

    private function summarize($res)
    {
        if (is_array($res)) return ['array_count' => count($res), 'keys' => array_slice(array_keys($res),0,10)];
        if ($res instanceof \Illuminate\Http\JsonResponse) {
            $data = $res->getData(true);
            return ['json_keys' => array_slice(array_keys((array)$data),0,10)];
        }
        return ['type' => is_object($res) ? get_class($res) : gettype($res)];
    }
}
