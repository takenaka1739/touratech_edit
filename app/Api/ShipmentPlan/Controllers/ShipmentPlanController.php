<?php

namespace App\Api\ShipmentPlan\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ShipmentPlan\Services\ShipmentPlanPdfService;
use App\Api\ShipmentPlan\Services\ShipmentPlanService;
use App\Api\ShipmentPlan\Requests\ShipmentPlanFetchRequest;
use App\Api\ShipmentPlan\Requests\ShipmentPlanBulkPurchaseRequest;
use App\Api\ShipmentPlan\Requests\ShipmentPlanOutputRequest;
use Illuminate\Support\Facades\Log;

/**
 * 発送予定一覧コントローラー
 */
class ShipmentPlanController extends BaseController
{
  /** @var \App\Api\ShipmentPlan\Services\ShipmentPlanService */
  protected $service;

  /**
   * @param \App\Api\ShipmentPlan\Services\ShipmentPlanService $service
   */
  public function __construct(ShipmentPlanService $service)
  {
    $this->service = $service;
  }

  /**
   * 一覧画面
   */
  public function fetch(ShipmentPlanFetchRequest $request)
  {
    $input = $request->all();
    $data = $this->service->fetch($input);

    return $this->success($data);
  }

  /**
   * 一括仕入バリデーション
   */
  public function validate_bulk_purchase(ShipmentPlanBulkPurchaseRequest $request)
  {
    $rows = $this->service->checkItemNumber($request->validated());

    if ($rows->count() > 0) {
      $item_numbers = $rows->unique('item_number')->pluck('item_number');
      return $this->error("商品マスタに存在しない品番が選択されています。", [
        'item_numbers' => $item_numbers,
      ]);
    }

    return $this->success();
  }

  /**
   * 一括仕入
   */
  public function bulk_purchase(ShipmentPlanBulkPurchaseRequest $request)
  {
    $this->service->bulkPurchase($request->validated());
    return $this->success();
  }

  /**
   * ラベル発行
   */
  public function output(ShipmentPlanOutputRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new ShipmentPlanPdfService();
    $pdf->isPrintPrice = $request->get('isPrintPrice', false);
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}