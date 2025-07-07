<?php

namespace App\Web\HomeDataImport\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\HomeDataImport\Services\HomeDataImportOutputService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 本国商品データ取込コントローラー
 */
class HomeDataImportController extends Controller
{
  /** @var \App\Api\HomeDataImport\Services\HomeDataImportOutputService */
  protected $service;

  /**
   * @param \App\Api\HomeDataImport\Services\HomeDataImportOutputService $service
   */
  public function __construct(HomeDataImportOutputService $service)
  {
    $this->service = $service;
  }

  public function output(string $file_id)
  {
    $path = $this->service->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path));
  }
}
