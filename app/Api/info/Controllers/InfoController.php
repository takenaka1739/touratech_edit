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
     * GET /api/info/items?keyword=&page=&category_id=&per_page=
     */
    public function searchItems(Request $request, InfoService $service): JsonResponse
    {
        $keyword = $request->query('keyword');
        $page    = (int) $request->query('page', 1);

        // ★ 追加：カテゴリID（m_categories.id）
        $categoryIdRaw = $request->query('category_id');
        $categoryId = null;
        if ($categoryIdRaw !== null && $categoryIdRaw !== '') {
            $categoryId = (int) $categoryIdRaw;
        }

        // ★ 追加：1ページ件数（フロントから渡る想定）
        $perPageRaw = $request->query('per_page');
        $perPage = null;
        if ($perPageRaw !== null && $perPageRaw !== '') {
            $perPage = (int) $perPageRaw;
        }

        Log::info('[InfoController][searchItems] enter', [
            'keyword'      => $keyword,
            'page'         => $page,
            'category_id'  => $categoryId,
            'per_page'     => $perPage,
        ]);

        // ★ 変更：categoryId / perPage を service に渡す
        $result = $service->searchItems($keyword, $page, $categoryId, $perPage);

        return response()->json($result);
    }

    /**
     * カテゴリ検索（カテゴリそのものを選択するモーダル用）
     * GET /api/info/categories?keyword=&parent_code=
     */
    public function searchCategories(Request $request, InfoService $service): JsonResponse
    {
        $keyword    = $request->query('keyword');
        $parentCode = $request->query('parent_code');

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
