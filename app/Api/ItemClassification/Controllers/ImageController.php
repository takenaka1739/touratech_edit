<?php

namespace App\Api\ItemClassification\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ItemClassification\Requests\ImageStoreRequest;
use App\Api\ItemClassification\Requests\ImageUpdateRequest;
use App\Api\ItemClassification\Services\ImageService;
use Illuminate\Http\Request;

/**
 * 商品分類マスタ
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
    \Log::debug('デバッグ：ImageController.__construct');

    $this->service = $service;
  }

  /**
   * 登録
   */
  public function store(ImageStoreRequest $request)
  {
    \Log::debug('ImageStoreRequest');
    \Log::debug('$request->validated()');
    \Log::debug($request->validated());

    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 商品分類ID
   */
  public function update(ImageUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }
//
//  /**
//   * 削除
//   *
//   * @param int $id 商品分類ID
//   */
//  public function delete(int $id)
//  {
//    $this->service->delete($id);
//
//    return $this->success();
//  }
}