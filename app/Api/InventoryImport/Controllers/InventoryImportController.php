<?php

namespace App\Api\InventoryImport\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\InventoryImport\Services\InventoryImportService;
use App\Api\InventoryImport\Services\InventoryImportPdfService;
use App\Api\InventoryImport\Requests\InventoryImportFetchRequest;
use App\Api\InventoryImport\Requests\InventoryImportUploadRequest;
use App\Api\InventoryImport\Requests\InventoryImportDetailRequest;
use App\Api\InventoryImport\Requests\InventoryImportOutputRequest;
use App\Api\InventoryImport\Requests\InventoryImportConfirmRequest;
use Exception;

/**
 * 棚卸処理コントローラー
 */
class InventoryImportController extends BaseController
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  /**
   * @param \App\Api\InventoryImport\Services\InventoryImportService $service
   */
  public function __construct(InventoryImportService $service)
  {
    $this->service = $service;
  }

  /**
   * 読込
   */
  public function fetch(InventoryImportFetchRequest $request)
  {
    $data = $this->service->fetch($request->validated());
    $data["hasInventory"] = $this->service->hasInventory($request->validated());
    $data["hasInventoryImport"] = $this->service->hasInventoryImport($request->validated());
    return $this->success($data);
  }

  /**
   * 発送予定取込バリデーション
   */
  public function validate_upload(InventoryImportUploadRequest $request)
  {
    if ($this->service->hasInventory($request->validated())) {
      return $this->error("", [
        'has_inventory' => '既に棚卸確定済の年月のため、取込を行うことができません。',
      ]);
    }

    return $this->success();
  }

  /**
   * 発送予定取込
   */
  public function upload(InventoryImportUploadRequest $request)
  {
    if ($this->service->hasInventory($request->validated())) {
      throw new Exception();
    }

    $this->service->upload($request->file('file')->path(), $request->validated());

    $data = $this->service->fetch($request->validated());
    return $this->success($data);
  }

  /**
   * 明細
   */
  public function detail(InventoryImportDetailRequest $request)
  {
    $this->service->update($request->validated());

    return $this->success();
  }
  
  /**
   * 一覧出力
   */
  public function output(InventoryImportOutputRequest $request)
  {
    $data = $this->service->getPdfData($request->validated());

    $pdf = new InventoryImportPdfService();
    $file_id = $pdf->createPdf($data);

    return $this->success([
      'file_id' => $file_id,
    ]);
  }

  /**
   * 在庫確定
   */
  public function confirm(InventoryImportConfirmRequest $request)
  {
    if ($this->service->hasInventory($request->validated())) {
      throw new Exception();
    }

    $this->service->confirm($request->validated());

    return $this->success();
  }

}
