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
     * 画像一覧（既存画像の検索・ページング）
     * GET /api/item_classification/images?keyword=xxx&page=1
     */
    public function index(Request $request)
    {
        Log::info('ImageController@index:start', ['input' => $request->all()]);
        $data = $this->service->list($request->all());
        return $this->success($data);
    }

    /**
     * 登録（新規）
     */
    public function store(ImageStoreRequest $request)
    {
        $this->service->store($request->validated());

        return $this->success();
    }

    /**
     * 更新（名前変更／紐付け変更／差し替え）
     *
     * @param int $id m_images.id
     */
    public function update(ImageUpdateRequest $request, int $id)
    {
        Log::info('ImageController@update:start', [
            'id'    => $id,
            'input' => $request->validated(),
            'has_file' => $request->hasFile('file'),
        ]);

        $this->service->update($id, $request->validated());

        return $this->success();
    }
}
