<?php

namespace App\Api\TopImage\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use App\Base\Models\MImage;

class ImageController extends BaseController
{
    /**
     * 画像一覧（フロントが期待する { rows, pager } 形式で返却）
     * GET /api/images?search=&page=1&per_page=12
     */
    public function index(Request $request)
    {
        $search  = (string) $request->query('search', '');
        $page    = (int) $request->query('page', 1);

        // ★追加: per_page をクエリから受ける（範囲制限つき）
        $perPage = (int) $request->query('per_page', 12);
        // 不正値対策（小数/0/巨大値など）
        if ($perPage <= 0) {
            $perPage = 12;
        }
        // 上限・下限（必要に応じて調整）
        $perPage = max(4, min(48, $perPage));

        $q = MImage::query()->select(['id', 'name']);
        if ($search !== '') {
            $q->where('name', 'like', "%{$search}%");
        }

        $paginator = $q->orderByDesc('id')->paginate($perPage, ['*'], 'page', $page);

        $rows = array_map(
            fn ($r) => ['id' => $r->id, 'name' => $r->name],
            $paginator->items()
        );

        return response()->json([
            'rows'  => $rows,
            'pager' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * 画像アップロード
     * POST /api/images/upload
     * フロントは FormData の files[] で複数投入
     */
    public function upload(Request $request)
    {
        $request->validate([
            'files.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:20480'], // 20MB
        ]);

        $created   = [];
        $targetDir = public_path('images');

        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        foreach ((array) $request->file('files', []) as $file) {
            $ext  = strtolower($file->getClientOriginalExtension());
            $fname = Str::uuid()->toString() . '.' . $ext;

            $file->move($targetDir, $fname);

            $img = MImage::create([
                'name'        => $fname,
                'category_id' => null,
                'item_id'     => null,
            ]);

            $created[] = [
                'id'   => $img->id,
                'name' => $img->name,
            ];
        }

        return response()->json([
            'created' => $created,
        ]);
    }
}
