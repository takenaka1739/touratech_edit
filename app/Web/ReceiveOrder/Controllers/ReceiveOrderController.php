<?php

namespace App\Web\ReceiveOrder\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ReceiveOrder\Services\ReceiveOrderPdfService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * 受注データコントローラー
 */
class ReceiveOrderController extends Controller
{
  public function output(string $file_id)
  {
    $pdf = new ReceiveOrderPdfService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }
    return response(Storage::get($path))
      ->header('Content-Type', 'application/pdf')
      ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("ご注文承り書.pdf"));
  }
}
