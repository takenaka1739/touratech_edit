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
     * ローカルの画像をアップロードして、m_images テーブルに登録する。
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

                return response()->json(['success' => true, 'message' => 'アップロードに成功しました', 'data' => $data,]);

            } catch (\Exception $e) {
                Log::error('ファイルアップロード失敗', ['error' => $e->getMessage()]);
                return response()->json(['success' => false, 'message' => 'アップロードに失敗しました'], 500);
            }
        }
    }

    /**
     * ローカルの画像をアップロードして、m_images テーブルを更新する。
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

                $this->service->update($id, $data);

                return response()->json(['success' => true, 'message' => 'アップロードに成功しました', 'data' => $data,]);

            } catch (\Exception $e) {
                Log::error('ファイルアップロード失敗', ['error' => $e->getMessage()]);
                return response()->json(['success' => false, 'message' => 'アップロードに失敗しました'], 500);
            }
        }
    }

    /**
     * サーバーアップロード済の画像選択情報を m_images テーブルに登録する。
     */
    public function storeMeta(ImageStoreRequest $request)
    {
        $data = $request->validated();

        try {
            // アップロードした画像情報を m_images に登録
            $image = $this->service->store($data);

            return response()->json(['success' => true, 'message' => '画像情報を登録しました', 'data' => $image,]);

        } catch (\Exception $e) {
            Log::error('画像情報登録失敗', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => '画像情報の登録に失敗しました'], 500);
        }
    }

    /**
     * サーバーアップロード済の画像選択情報で、m_images テーブルを更新する。
     *
     * @param int $id m_images.id
     */
    public function updateMeta(ImageUpdateRequest $request, int $id)
    {
        $data = $request->validated();

        try {
            $image = $this->service->update($id, $data);

            return response()->json(['success' => true, 'message' => '画像情報を登録しました', 'data' => $image,]);

        } catch (\Exception $e) {
            Log::error('画像情報登録失敗', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => '画像情報の登録に失敗しました'], 500);
        }
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
