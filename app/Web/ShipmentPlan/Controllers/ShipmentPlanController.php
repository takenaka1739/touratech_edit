<?php

namespace App\Web\ShipmentPlan\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShipmentPlan\Services\ShipmentPlanPdfService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 発送予定一覧コントローラー
 */
class ShipmentPlanController extends Controller
{
  /**
   * ラベル発行
   *
   * @param string $file_id
   */
  public function output(string $file_id)
  {
    $pdf = new ShipmentPlanPdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("ラベル.pdf"));
  }
}
