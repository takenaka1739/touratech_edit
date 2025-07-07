<?php

namespace App\Api\Hiden\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Hiden\Requests\HidenOutputRequest;
use App\Api\Hiden\Services\HidenService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * 売上飛伝出力コントローラー
 */
class HidenController extends BaseController
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

  /**
   * ヤマトB2用csv出力
   */
  public function outputB2(HidenOutputRequest $request)
  {
    $file_id = $this->service->createB2Csv($request->validated());
    $dt = new Carbon();
    $today = $dt->format("Ymd");
    $file_name = "B2連携_${today}.csv";

    return $this->success([
      'file_id' => $file_id,
      'file_name' => $file_name,
    ]);
  }

  /**
   * e飛伝用csv出力
   */
  public function outputHiden(HidenOutputRequest $request)
  {
    $file_id = $this->service->createHidenCsv($request->validated());
    $dt = new Carbon();
    $today = $dt->format("Ymd");
    $file_name = "e飛伝2連携_${today}.csv";

    return $this->success([
      'file_id' => $file_id,
      'file_name' => $file_name,
    ]);
  }
}
