<?php

namespace App\Api\HomeDataImport\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\HomeDataImport\Services\HomeDataImportService;
use App\Api\HomeDataImport\Services\HomeDataImportOutputService;
use App\Api\HomeDataImport\Requests\HomeDataImportUploadRequest;
use Illuminate\Support\Carbon;

/**
 * 本国商品データ取込コントローラー
 */
class HomeDataImportController extends BaseController
{
  /** @var \App\Api\HomeDataImport\Services\HomeDataImportService */
  protected $service;

  /**
   * @param \App\Api\HomeDataImport\Services\HomeDataImportService $service
   */
  public function __construct(HomeDataImportService $service)
  {
    $this->service = $service;
  }

  /**
   * 本国商品データ取込
   */
  public function upload(HomeDataImportUploadRequest $request)
  {
    $ymd = Carbon::now()->format('Ymd');
    $dir = config('const.paths.home_data_import.output_path') . $ymd;

    $path = $request->file('file')->store($dir);
    $this->service->upload(app_storage_path($path));

    $service = new HomeDataImportOutputService();
    $file_id = $service->createZip();
    $ymd = Carbon::now()->format('Ymd');
    $file_name = "item_${ymd}.zip";

    return $this->success([
      'file_id' => $file_id,
      'file_name' => $file_name,
    ]);
  }
}
