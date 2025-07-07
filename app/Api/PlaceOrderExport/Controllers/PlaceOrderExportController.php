<?php

namespace App\Api\PlaceOrderExport\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\PlaceOrderExport\Requests\PlaceOrderExportOutputRequest;
use App\Api\PlaceOrderExport\Services\PlaceOrderExportService;
use Illuminate\Support\Carbon;

/**
 * 発注確定コントローラー
 */
class PlaceOrderExportController extends BaseController
{
  /** @var \App\Api\PlaceOrderExport\Services\PlaceOrderExportService */
  protected $service;

  /**
   * @param \App\Api\PlaceOrderExport\Services\PlaceOrderExportService $service
   */
  public function __construct(PlaceOrderExportService $service)
  {
    $this->service = $service;
  }

  /**
   * 発注用CSVファイル出力
   */
  public function output(PlaceOrderExportOutputRequest $request)
  {
    $file_id = $this->service->createZip($request->validated());
    if (!$file_id) {
      return $this->error("", [
        'c_place_order_date_from' => '対象期間のデータが存在しません。',
      ]);
    }

    $output_name = "Order";
    $suffix = Carbon::now()->format('YmdH');
    $file_name = "${output_name}_${suffix}.zip";

    return $this->success([
      'file_id' => $file_id,
      'file_name' => $file_name,
    ]);
  }
}
