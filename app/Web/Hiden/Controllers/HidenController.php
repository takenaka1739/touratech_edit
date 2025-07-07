<?php

namespace App\Web\Hiden\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\Hiden\Services\HidenService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 売上飛伝出力コントローラー
 */
class HidenController extends Controller
{
  /** @var \App\Api\Hiden\Services\HidenService */
  protected $service;

  /**
   * @param \App\Api\Hiden\Services\HidenService $service
   */
  public function __construct(HidenService $service)
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
