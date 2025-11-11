<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
//use App\Api\Item\Requests\ItemStoreRequest;
//use App\Api\Item\Requests\ItemUpdateRequest;
//use App\Api\Item\Requests\ItemOutputRequest;
//use App\Api\Item\Requests\ItemGetIdRequest;
//use App\Api\Item\Requests\ItemGetDetailRequest;
use App\Api\Item\Services\SpecialSaleService;
use App\Api\Item\Requests\SpecialSaleStoreRequest;
use App\Api\Item\Requests\SpecialSaleUpdateRequest;
//use App\Api\Item\Services\ItemPdfService;
//use App\Api\Item\Services\ItemExcelService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * 商品マスタコントローラー
 */
class SpecialSaleController extends BaseController
{
  /** @var \App\Api\Item\Services\SpecialSaleService */
  protected $service;

  /**
   * @param \App\Api\Item\Services\SpecialSaleService $service
   */
  public function __construct(SpecialSaleService $service)
  {
    \log::debug('SpecialSaleController.__construct');
    $this->service = $service;
  }

    /**
   * 登録
   */
  public function store(SpecialSaleStoreRequest $request)
  {
    \log::debug('SpecialSaleController.store');
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 商品ID
   */
  public function update(SpecialSaleUpdateRequest $request, int $id)
  {
    \log::debug('デバッグ：SpecialSaleController.update');

    $this->service->update($id, $request->validated());

    return $this->success();
  }

//  /**
//   * 削除
//   *
//   * @param int $id 商品分類ID
//   */
  public function delete($id)
  {
    \Log::debug('ImageController.delete');
    \Log::debug($id);
    $this->service->delete($id);

    return $this->success();
  }
}