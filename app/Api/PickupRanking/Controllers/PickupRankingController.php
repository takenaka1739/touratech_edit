<?php

namespace App\Api\PickupRanking\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\PickupRanking\Services\PickupRankingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PickupRankingController extends BaseController
{
    protected PickupRankingService $service;

    public function __construct(PickupRankingService $service)
    {
        $this->service = $service;
    }

    public function fetch(Request $request)
    {
        try {
            $data = $this->service->fetch($request->all());
            return $this->success($data);
        } catch (\Throwable $e) {
            Log::error('【注目ランキング 一覧取得エラー】', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'データの取得に失敗しました。',
            ], 500);
        }
    }

    public function edit(int $id)
    {
        try {
            $data = $this->service->get($id);

            // 互換：フロント表示用に item_id / item_number / item_name を付与
            if (is_array($data)) {
                $itemCode = $data['item_code'] ?? null;

                if ($itemCode) {
                    // 代表 = code内で id最小
                    $item = DB::table('m_items')
                        ->select('id', 'item_number', 'code', 'name')
                        ->where('code', $itemCode)
                        ->orderBy('id', 'asc')
                        ->first();

                    if ($item) {
                        $data['item_id'] = (int)$item->id;
                        $data['item_number'] = (string)($item->item_number ?? $item->code ?? '');
                        $data['item_name'] = (string)($item->name ?? '');
                    }
                }
            }

            return $this->success($data);
        } catch (\Throwable $e) {
            Log::error('【注目ランキング 詳細取得エラー】', [
                'id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'データの取得に失敗しました。',
            ], 500);
        }
    }

    /**
     * 商品検索（モーダル一覧用）
     * GET /api/pickup_ranking/items?page=1&per_page=8&keyword=xxx
     */
    public function items(Request $request)
    {
        try {
            $page = max(1, (int)$request->query('page', 1));
            $perPage = (int)$request->query('per_page', 8);
            $perPage = ($perPage > 0 && $perPage <= 50) ? $perPage : 8;
            $keyword = trim((string)$request->query('keyword', ''));

            // 代表 = code単位で id最小 のみ
            $sub = DB::table('m_items as i')
                ->select('i.code', DB::raw('MIN(i.id) as min_id'))
                ->whereNotNull('i.code')
                ->where('i.code', '!=', '');

            if (Schema::hasColumn('m_items', 'deleted_at')) {
                $sub->whereNull('i.deleted_at');
            }
            if (Schema::hasColumn('m_items', 'is_sell')) {
                $sub->where('i.is_sell', 1);
            }

            if ($keyword !== '') {
                $sub->where(function ($w) use ($keyword) {
                    $w->where('i.item_number', 'like', "%{$keyword}%")
                        ->orWhere('i.code', 'like', "%{$keyword}%")
                        ->orWhere('i.name', 'like', "%{$keyword}%");
                });
            }

            $sub->groupBy('i.code');

            $q = DB::table(DB::raw("({$sub->toSql()}) as x"))
                ->mergeBindings($sub)
                ->join('m_items as i', 'i.id', '=', 'x.min_id')
                ->select(['i.id', 'i.item_number', 'i.code', 'i.name'])
                ->orderBy('i.name', 'asc')
                ->orderBy('i.id', 'asc');

            $pager = $q->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'rows' => $pager->items(),
                'pager' => [
                    'current_page' => $pager->currentPage(),
                    'last_page' => $pager->lastPage(),
                    'total' => $pager->total(),
                    'per_page' => $pager->perPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('【注目ランキング 商品検索エラー】', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'データの取得に失敗しました。',
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('[pickup_ranking] store hit', [
                'user_id' => auth()->id(),
                'payload' => $request->all(),
            ]);

            /**
             * ★表示順入力対応
             * - フロントから manual_priority / sort_order どちらが来ても受ける（互換）
             */
            $data = $request->validate([
                'item_id' => ['required', 'integer'],
                'manual_priority' => ['nullable', 'integer', 'min:1', 'max:9999'],
                'sort_order' => ['nullable', 'integer', 'min:1', 'max:9999'],
                'is_enabled' => ['nullable'],
                'memo' => ['nullable', 'string', 'max:1024'],
            ], [
                'item_id.required' => '対象商品は必須です。',
                'item_id.integer' => '対象商品が不正です。',
                'manual_priority.integer' => '表示順は数値で入力してください。',
                'manual_priority.min' => '表示順は1以上で入力してください。',
                'sort_order.integer' => '表示順は数値で入力してください。',
                'sort_order.min' => '表示順は1以上で入力してください。',
            ]);

            $itemQ = DB::table('m_items')
                ->select('id', 'code');

            if (Schema::hasColumn('m_items', 'deleted_at')) {
                $itemQ->addSelect('deleted_at')->whereNull('deleted_at');
            }
            if (Schema::hasColumn('m_items', 'is_sell')) {
                $itemQ->addSelect('is_sell')->where('is_sell', 1);
            }

            $item = $itemQ
                ->where('id', (int)$data['item_id'])
                ->first();

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => '商品が見つかりません。（非公開/削除済みの可能性があります）',
                ], 422);
            }

            // 表示順（manual_priority 優先、なければ sort_order）
            $displayOrder = null;
            if (array_key_exists('manual_priority', $data)) {
                $displayOrder = $data['manual_priority'];
            }
            if ($displayOrder === null && array_key_exists('sort_order', $data)) {
                $displayOrder = $data['sort_order'];
            }

            $payload = [
                'item_code' => (string)$item->code,
                'represent_item_id' => (int)$item->id,
                'is_enabled' => array_key_exists('is_enabled', $data) ? (bool)$data['is_enabled'] : true,
                // Service側がどちらのキーを見ても良いように両方入れる（片方しか使わなくてもOK）
                'manual_priority' => $displayOrder,
                'sort_order' => $displayOrder,
                'memo' => $data['memo'] ?? null,
            ];

            if ($this->service->existsByItemCode($payload['item_code'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'この商品コードはすでに手動登録されています。',
                ], 422);
            }

            $this->service->store($payload);
            return $this->success();
        } catch (\Throwable $e) {
            $extra = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];
            if ($e instanceof \Illuminate\Database\QueryException) {
                $extra['sql'] = $e->getSql();
                $extra['bindings'] = $e->getBindings();
                $extra['sqlstate'] = $e->errorInfo[0] ?? null;
                $extra['driver_code'] = $e->errorInfo[1] ?? null;
            }

            Log::error('【注目ランキング 登録エラー】', $extra);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: '登録に失敗しました。',
                'debug' => $extra,
            ], 500);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            Log::info('[pickup_ranking] update hit', [
                'id' => $id,
                'user_id' => auth()->id(),
                'payload' => $request->all(),
            ]);

            /**
             * ★表示順入力対応
             * - フロントから manual_priority / sort_order どちらが来ても受ける（互換）
             */
            $data = $request->validate([
                'item_id' => ['required', 'integer'],
                'manual_priority' => ['nullable', 'integer', 'min:1', 'max:9999'],
                'sort_order' => ['nullable', 'integer', 'min:1', 'max:9999'],
                'is_enabled' => ['nullable'],
                'memo' => ['nullable', 'string', 'max:1024'],
            ], [
                'item_id.required' => '対象商品は必須です。',
                'item_id.integer' => '対象商品が不正です。',
                'manual_priority.integer' => '表示順は数値で入力してください。',
                'manual_priority.min' => '表示順は1以上で入力してください。',
                'sort_order.integer' => '表示順は数値で入力してください。',
                'sort_order.min' => '表示順は1以上で入力してください。',
            ]);

            $itemQ = DB::table('m_items')
                ->select('id', 'code');

            if (Schema::hasColumn('m_items', 'deleted_at')) {
                $itemQ->addSelect('deleted_at')->whereNull('deleted_at');
            }
            if (Schema::hasColumn('m_items', 'is_sell')) {
                $itemQ->addSelect('is_sell')->where('is_sell', 1);
            }

            $item = $itemQ
                ->where('id', (int)$data['item_id'])
                ->first();

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => '商品が見つかりません。（非公開/削除済みの可能性があります）',
                ], 422);
            }

            // 表示順（manual_priority 優先、なければ sort_order）
            $displayOrder = null;
            if (array_key_exists('manual_priority', $data)) {
                $displayOrder = $data['manual_priority'];
            }
            if ($displayOrder === null && array_key_exists('sort_order', $data)) {
                $displayOrder = $data['sort_order'];
            }

            $payload = [
                'item_code' => (string)$item->code,
                'represent_item_id' => (int)$item->id,
                'is_enabled' => array_key_exists('is_enabled', $data) ? (bool)$data['is_enabled'] : true,
                'manual_priority' => $displayOrder,
                'sort_order' => $displayOrder,
                'memo' => $data['memo'] ?? null,
            ];

            if ($this->service->existsByItemCodeExceptId($payload['item_code'], $id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'この商品コードは他の手動登録で使用されています。',
                ], 422);
            }

            $this->service->update($id, $payload);
            return $this->success();
        } catch (\Throwable $e) {
            $extra = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];
            if ($e instanceof \Illuminate\Database\QueryException) {
                $extra['sql'] = $e->getSql();
                $extra['bindings'] = $e->getBindings();
                $extra['sqlstate'] = $e->errorInfo[0] ?? null;
                $extra['driver_code'] = $e->errorInfo[1] ?? null;
            }

            Log::error('【注目ランキング 更新エラー】', $extra);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: '更新に失敗しました。',
                'debug' => $extra,
            ], 500);
        }
    }

    public function delete(int $id)
    {
        try {
            $this->service->delete($id);
            return $this->success();
        } catch (\Throwable $e) {
            $extra = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];
            if ($e instanceof \Illuminate\Database\QueryException) {
                $extra['sql'] = $e->getSql();
                $extra['bindings'] = $e->getBindings();
                $extra['sqlstate'] = $e->errorInfo[0] ?? null;
                $extra['driver_code'] = $e->errorInfo[1] ?? null;
            }

            Log::error('【注目ランキング 削除エラー】', $extra);

            return response()->json([
                'success' => false,
                'message' => '削除に失敗しました。',
                'debug' => $extra,
            ], 500);
        }
    }

    public function toggleActive(int $id)
    {
        try {
            $isEnabled = $this->service->toggleActive($id);
            return response()->json([
                'success' => true,
                'is_enabled' => $isEnabled,
            ]);
        } catch (\Throwable $e) {
            Log::error('【注目ランキング 有効切替エラー】', [
                'id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '切り替えに失敗しました',
            ], 500);
        }
    }

    /**
     * PV由来（item_code指定）でも有効/無効できる
     * POST /api/pickup_ranking/toggle-active-by-code
     * payload: { item_code: "XXXXX" }
     */
    public function toggleActiveByCode(Request $request)
    {
        try {
            $data = $request->validate([
                'item_code' => ['required', 'string'],
            ], [
                'item_code.required' => '商品コードは必須です。',
            ]);

            $itemCode = trim((string)$data['item_code']);
            if ($itemCode === '') {
                return response()->json([
                    'success' => false,
                    'message' => '商品コードは必須です。',
                ], 422);
            }

            // Service 側のメソッド名は toggleActiveByItemCode()
            $isEnabled = $this->service->toggleActiveByItemCode($itemCode);

            return response()->json([
                'success' => true,
                'is_enabled' => $isEnabled,
            ]);
        } catch (\Throwable $e) {
            Log::error('【注目ランキング codeトグルエラー】', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '切り替えに失敗しました',
            ], 500);
        }
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ], [
            'ids.required' => '並び替え対象がありません。',
        ]);

        try {
            $this->service->reorder($data['ids']);
            return $this->success();
        } catch (\Throwable $e) {
            Log::error('【注目ランキング 並び替えエラー】', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '並び替えに失敗しました。',
            ], 500);
        }
    }

    /**
     * 商品情報（選択後の表示用）
     * 兼：既に注目ランキング（手動登録）済みか判定して返す
     *
     * GET /api/pickup_ranking/item/{id}?except_pickup_ranking_id=123
     */
    public function item(int $id, Request $request)
    {
        try {
            $row = DB::table('m_items')
                ->select('id', 'item_number', 'code', 'name')
                ->where('id', $id)
                ->first();

            if (!$row) {
                return response()->json([
                    'success' => false,
                    'message' => '商品が見つかりません。',
                ], 404);
            }

            $code = (string)($row->code ?? '');
            $exceptId = (int)$request->query('except_pickup_ranking_id', 0);

            // 既に手動登録されているか（code単位）
            $existsQ = DB::table('t_pickup_rankings as pr')
                ->join('m_items as i', 'i.id', '=', 'pr.item_id')
                ->where('i.code', $code);

            if ($exceptId > 0) {
                $existsQ->where('pr.id', '!=', $exceptId);
            }

            $registered = $existsQ->select('pr.id')->orderBy('pr.id', 'asc')->first();
            $isRegistered = $registered ? true : false;

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (int)$row->id,
                    'item_number' => (string)($row->item_number ?? $row->code ?? ''),
                    'code' => $code,
                    'name' => (string)($row->name ?? ''),

                    // ★フロントで「登録済み」ポップアップ判定に使う
                    'is_registered' => $isRegistered,
                    'pickup_ranking_id' => $registered ? (int)$registered->id : null,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('【注目ランキング 商品取得エラー】', [
                'id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'データの取得に失敗しました。',
            ], 500);
        }
    }
}
