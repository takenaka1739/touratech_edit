<?php

namespace App\Api\InventoryPrinting\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\InventoryPrinting\Requests\InventoryPrintingOutputRequest;
use App\Api\InventoryPrinting\Services\InventoryPrintingPdfService;
use App\Api\InventoryPrinting\Services\InventoryPrintingExcelService;
use App\Api\InventoryPrinting\Services\InventoryPrintingService;

/**
 * 在庫表印刷コントローラー
 */
class InventoryPrintingController extends BaseController
{
  /** @var \App\Api\InventoryPrinting\Services\InventoryPrintingService */
  protected $service;

  /**
   * @param \App\Api\InventoryPrinting\Services\InventoryPrintingService $service
   */
  public function __construct(InventoryPrintingService $service)
  {
    $this->service = $service;
  }

  /**
   * 在庫表発行
   */
  public function print(InventoryPrintingOutputRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new InventoryPrintingPdfService();
    $file_id = $pdf->createPdf($data);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 在庫表出力
   */
  public function output(InventoryPrintingOutputRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $excel = new InventoryPrintingExcelService();
    $file_id = $excel->createExcel($data);
    return $this->success([
      'file_id' => $file_id,
    ]);
  }
}
