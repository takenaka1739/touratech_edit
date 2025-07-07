<?php

namespace App\Web\Estimate\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\Estimate\Services\EstimatePdfService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 見積データコントローラー
 */
class EstimateController extends Controller
{
  public function output(string $file_id)
  {
    $pdf = new EstimatePdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("見積書【TTJP】.pdf"));
  }
}
