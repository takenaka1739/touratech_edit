<?php

namespace App\Api\ItemClassification\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ItemClassification\Requests\ImageStoreRequest;
use App\Api\ItemClassification\Requests\ImageUpdateRequest;
use App\Api\ItemClassification\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * 商品分類マスタ（画像）
 */
class ImageController extends BaseController
{
    /** @var \App\Api\ItemClassification\Services\ImageService */
    protected $service;

    /**
     * @param \App\Api\ItemClassification\Services\ImageService $service
     */
    public function __construct(ImageService $service)
    {
        $this->service = $service;
    }

    /**
     * 商品分類の画像を登録する。
     */
    public function store(ImageStoreRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            try {
                $file = $request->file('file');
                $filename = $file->getClientOriginalName();
                $directory = public_path('images');

                if (!file_exists($directory)) mkdir($directory, 0777, true);

                $file->move($directory, $filename);
                $data['path'] = 'images/' . $filename;
                $data['name'] = $filename;

                // アップロードした画像情報を m_images に登録
                $this->service->store([
                    'category_id' => $request->input('category_id'),
                    'name'        => $filename,
                ]);

            } catch (\Exception $e) {
                Log::error('ファイルアップロード失敗', ['error' => $e->getMessage()]);
                return response()->json(['success' => false, 'message' => 'アップロードに失敗しました'], 500);
            }
        }

        return response()->json(['success' => true, 'message' => 'アップロードに成功しました', 'data' => $data,]);
    }

    /**
     * 商品分類の画像を更新する。
     * 編集時と異なる画像が選択された場合のみ実行される。
     *
     * @param int $id m_images.id
     */
    public function update(ImageUpdateRequest $request, int $id)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            try {
                $file = $request->file('file');
                $filename = $file->getClientOriginalName();
                $directory = public_path('images');

                if (!file_exists($directory)) mkdir($directory, 0777, true);

                $file->move($directory, $filename);
                $data['path'] = 'images/' . $filename;
                $data['name'] = $filename;

            } catch (\Exception $e) {
                Log::error('ファイルアップロード失敗', ['error' => $e->getMessage()]);
                return response()->json(['success' => false, 'message' => 'アップロードに失敗しました'], 500);
            }
        }

        $this->service->update($id, $data);
        
        return response()->json(['success' => true, 'message' => 'アップロードに成功しました', 'data' => $data,]);
    }
    
    /**
     * 画像一覧（既存画像の検索・ページング）
     * GET /api/item_classification/images?keyword=xxx&page=1
     */
    public function list(Request $request)
    {
        Log::info('ImageController@list:start', ['input' => $request->all()]);
        $data = $this->service->list($request->all());
        return $this->success($data);
    }
}
