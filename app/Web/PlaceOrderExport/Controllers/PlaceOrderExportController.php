<?php

namespace App\Web\PlaceOrderExport\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\PlaceOrderExport\Services\PlaceOrderExportService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 発注CSV出力コントローラー
 */
class PlaceOrderExportController extends Controller
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

  public function output(string $file_id)
  {
    $path = $this->service->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path));
  }
}
