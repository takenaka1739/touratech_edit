<?php

namespace App\Api\TopImage\Controllers;

use App\Api\TopImage\Requests\TopImageRequest;
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

    public function store(TopImageRequest $request)
    {
        $this->logIncoming('[TopImage][store]', $request);
        $validated = $request->validated();
        Log::info('[TopImage][store] validated', $validated);

        try {
            $res = $this->service->create($validated);
            Log::info('[TopImage][store] service ok', ['summary' => $this->summarize($res)]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][store] service error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function update(int $id, TopImageRequest $request)
    {
        $this->logIncoming('[TopImage][update]', $request, ['id' => $id]);
        $validated = $request->validated();
        Log::info('[TopImage][update] validated', ['id' => $id] + $validated);

        try {
            $res = $this->service->update($id, $validated);
            Log::info('[TopImage][update] service ok', ['id' => $id, 'summary' => $this->summarize($res)]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][update] service error', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function destroy(int $id)
    {
        $this->logIncoming('[TopImage][destroy]', null, ['id' => $id]);
        try {
            $res = $this->service->delete($id);
            Log::info('[TopImage][destroy] service ok', ['id' => $id, 'summary' => $this->summarize($res)]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][destroy] service error', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function toggle(int $id)
    {
        $this->logIncoming('[TopImage][toggle]', null, ['id' => $id]);
        try {
            $res = $this->service->toggleVisibility($id);
            Log::info('[TopImage][toggle] service ok', ['id' => $id, 'summary' => $this->summarize($res)]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][toggle] service error', [
                'id'      => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function reorder(Request $request)
    {
        $this->logIncoming('[TopImage][reorder]', $request);
        $ids = (array) $request->input('ids', []);
        Log::info('[TopImage][reorder] parsed', [
            'count' => count($ids),
            'sample' => array_slice($ids, 0, 10),
        ]);

        try {
            $res = $this->service->reorder($ids);
            Log::info('[TopImage][reorder] service ok', ['summary' => $this->summarize($res)]);
            return $res;
        } catch (\Throwable $e) {
            Log::error('[TopImage][reorder] service error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * 一括同期
     * フロントは axios.post('/api/TopImage/sync', { items })
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
                fn ($i) => is_array($i) ? Arr::only($i, ['id','image_id','url','is_enabled']) : $i,
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
            // デバッグしやすいよう 500 でそのまま投げる
            throw $e;
        }
    }

    // -------------------------
    // 共通：受信ログユーティリティ
    // -------------------------
    private function logIncoming(string $prefix, ?Request $request = null, array $extra = []): void
    {
        $req = $request ?? request();

        // 生ボディ（先頭だけ）
        $raw = null;
        try { $raw = file_get_contents('php://input'); } catch (\Throwable $e) {}

        // ヘッダ（Cookie/Authorization は除外）
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
        // サービス戻り値の概要用（配列/コレクション/レスポンスなど軽く）
        if (is_array($res)) return ['array_count' => count($res), 'keys' => array_slice(array_keys($res),0,10)];
        if ($res instanceof \Illuminate\Http\JsonResponse) {
            $data = $res->getData(true);
            return ['json_keys' => array_slice(array_keys((array)$data),0,10)];
        }
        return ['type' => is_object($res) ? get_class($res) : gettype($res)];
    }
}
