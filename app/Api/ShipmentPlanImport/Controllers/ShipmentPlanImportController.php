<?php

namespace App\Api\ShipmentPlanImport\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\ShipmentPlanImport\Services\ShipmentPlanImportService;
use App\Api\ShipmentPlanImport\Requests\ShipmentPlanImportUploadRequest;

/**
 * 発送予定取込コントローラー
 */
class ShipmentPlanImportController extends BaseController
{
  /** @var \App\Api\ShipmentPlanImport\Services\ShipmentPlanImportService */
  protected $service;

  /**
   * @param \App\Api\ShipmentPlanImport\Services\ShipmentPlanImportService $service
   */
  public function __construct(ShipmentPlanImportService $service)
  {
    $this->service = $service;
  }

  /**
   * 発送予定取込バリデーション
   */
  public function validation(ShipmentPlanImportUploadRequest $request)
  {
    return $this->success();
  }

  /**
   * 発送予定取込
   */
  public function upload(ShipmentPlanImportUploadRequest $request)
  {
    $this->service->upload($request->file('file')->path(), $request->validated());

    return $this->success();
  }
}
