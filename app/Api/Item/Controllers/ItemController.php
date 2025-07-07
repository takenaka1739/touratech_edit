<?php

namespace App\Api\Item\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Item\Requests\ItemStoreRequest;
use App\Api\Item\Requests\ItemUpdateRequest;
use App\Api\Item\Requests\ItemOutputRequest;
use App\Api\Item\Requests\ItemGetIdRequest;
use App\Api\Item\Requests\ItemGetDetailRequest;
use App\Api\Item\Services\ItemService;
use App\Api\Item\Services\ItemPdfService;
use App\Api\Item\Services\ItemExcelService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * 商品マスタコントローラー
 */
class ItemController extends BaseController
{
  /** @var \App\Api\Item\Services\ItemService */
  protected $service;

  /**
   * @param \App\Api\Item\Services\ItemService $service
   */
  public function __construct(ItemService $service)
  {
    $this->service = $service;
  }

  /**
   * 検索画面
   */
  public function dialog(Request $request)
  {
    $input = $request->all();
    $data = $this->service->dialog($input);

    return $this->success($data);
  }

  /**
   * 選択
   *
   * @param int $id 商品ID
   */
  public function selected(int $id)
  {
    $data = $this->service->selected($id);

    return $this->success($data);
  }

  /**
   * 一覧画面
   */
  public function fetch(Request $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  /**
   * 詳細画面
   *
   * @param int $id 商品ID
   */
  public function edit(int $id)
  {
    $data = $this->service->get($id);

    return $this->success($data);
  }

  /**
   * 登録
   */
  public function store(ItemStoreRequest $request)
  {
    $this->service->store($request->validated());

    return $this->success();
  }

  /**
   * 更新
   *
   * @param int $id 商品ID
   */
  public function update(ItemUpdateRequest $request, int $id)
  {
    $this->service->update($id, $request->validated());

    return $this->success();
  }

  /**
   * 削除
   *
   * @param int $id 商品ID
   */
  public function delete(int $id)
  {
    try {
      $this->service->delete($id);
      return $this->success();
    } catch (QueryException $ex) {
      if ($ex->getCode() === '23000') {
        return $this->error("使用されているため、削除できません。");
      }
      throw $ex;
    }
  }

  /**
   * ラベル発行
   */
  public function output(ItemOutputRequest $request)
  {
    $pdf = new ItemPdfService();
    $pdf->isPrintPrice = $request->get('isPrintPrice', false);
    $file_id = $pdf->createPdf($request->validated());

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * item_numberからIDを取得する
   */
  public function get_id(ItemGetIdRequest $request)
  {
    $data = new Collection($request->validated());
    $id = $this->service->getIdFromItemNumber($data->get('c_item_number'));

    if ($id) {
      return $this->success([
        'id' => $id
      ]);
    } else {
      return $this->error("", [
        "c_item_number" => "指定された品番は存在しないか削除されています",
      ]);
    }
  }

  /**
   * item_numberからitemを取得する
   */
  public function get_detail(ItemGetDetailRequest $request)
  {
    $data = new Collection($request->validated());
    $id = $this->service->getIdFromItemNumber($data->get('barcode'));
    $data = $this->service->selected($id);

    return $this->success($data);
  }
  
  /**
   * エクセル出力
   */
  public function output_excel(Request $request)
  {
    $input = $request->all();
    $rows = $this->service->getExcelData($input);

    $excel = new ItemExcelService();
    $file_id = $excel->createExcel($rows);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}