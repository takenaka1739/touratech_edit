<?php

namespace App\Api\info\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\info\Requests\InfoRequest;
use App\Api\info\Services\InfoService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class InfoController extends Controller
{
    /**
     * 投稿一覧取得
     * GET /api/info/posts?type=shop|product
     */
    public function index(Request $request, InfoService $service): JsonResponse
    {
        $type = $request->query('type'); // 'shop' | 'product' | null

        Log::info('[InfoController][index] enter', [
            'type' => $type,
        ]);

        $rows = $service->getPosts($type);

        return response()->json([
            'rows' => $rows,
        ]);
    }

    /**
     * 投稿新規登録
     * POST /api/info/posts
     */
    public function store(InfoRequest $request, InfoService $service): JsonResponse
    {
        Log::info('[InfoController][store] enter', [
            'payload' => $request->all(),
        ]);

        $post = $service->createPost($request->validated());

        return response()->json($post, 201);
    }

    /**
     * 投稿更新
     * PUT /api/info/posts/{id}
     */
    public function update(int $id, InfoRequest $request, InfoService $service): JsonResponse
    {
        Log::info('[InfoController][update] enter', [
            'id'      => $id,
            'payload' => $request->all(),
        ]);

        $post = $service->updatePost($id, $request->validated());

        return response()->json($post);
    }

    /**
     * 投稿削除（ソフトデリート想定）
     * DELETE /api/info/posts/{id}
     */
    public function destroy(int $id, InfoService $service): JsonResponse
    {
        Log::info('[InfoController][destroy] enter', [
            'id' => $id,
        ]);

        $service->deletePost($id);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * 商品検索（Items 用モーダル）
     * GET /api/info/items?keyword=&page=
     */
    public function searchItems(Request $request, InfoService $service): JsonResponse
    {
        $keyword = $request->query('keyword');
        $page    = (int)$request->query('page', 1);

        Log::info('[InfoController][searchItems] enter', [
            'keyword' => $keyword,
            'page'    => $page,
        ]);

        $result = $service->searchItems($keyword, $page);

        // フロント側が rows / pager 形式を期待しているのでそれに合わせる
        return response()->json($result);
    }

    /**
     * カテゴリ検索（カテゴリそのものを選択するモーダル用）
     * GET /api/info/categories?keyword=&parent_code=
     *
     * ここでは「カテゴリ自身」を1件選ぶための一覧データを返す。
     * 最終的に EC 側で /category-detail/... へのリンクに使える情報を持たせる。
     */
    public function searchCategories(Request $request, InfoService $service): JsonResponse
    {
        $keyword    = $request->query('keyword');
        $parentCode = $request->query('parent_code'); // 必要なら親コードで絞り込み

        Log::info('[InfoController][searchCategories] enter', [
            'keyword'     => $keyword,
            'parent_code' => $parentCode,
        ]);

        $rows = $service->searchCategories($keyword, $parentCode);

        return response()->json([
            'rows' => $rows,
        ]);
    }
}
