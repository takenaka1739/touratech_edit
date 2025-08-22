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
     * GET /api/images?search=&page=1
     */
    public function index(Request $request)
    {
        $search  = (string) $request->query('search', '');
        $page    = (int) $request->query('page', 1);
        $perPage = 12;

        $q = MImage::query()->select(['id', 'name']);
        if ($search !== '') {
            $q->where('name', 'like', "%{$search}%");
        }

        $paginator = $q->orderByDesc('id')->paginate($perPage, ['*'], 'page', $page);

        // rows は [ {id, name}, ... ] で返す
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
        // バリデーション（必要に応じて拡張してください）
        $request->validate([
            'files.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:20480'], // 20MB
        ]);

        $created   = [];
        $targetDir = public_path('images'); // 既存フローに合わせて public/images へ保存

        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        foreach ((array) $request->file('files', []) as $file) {
            $ext  = strtolower($file->getClientOriginalExtension());
            $fname = Str::uuid()->toString() . '.' . $ext;

            // 保存先: public/images/{fname}
            $file->move($targetDir, $fname);

            // m_images に登録
            // ※ MImage 側で fillable(['name','category_id','item_id']) を用意しておく
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

        Log::info('[ImageController@upload] uploaded', ['count' => count($created)]);

        return response()->json([
            'created' => $created,
        ]);
    }
}
