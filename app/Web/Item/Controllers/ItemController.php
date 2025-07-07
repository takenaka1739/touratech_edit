<?php

namespace App\Web\Item\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\Item\Services\ItemPdfService;
use App\Api\Item\Services\ItemExcelService;
use Illuminate\Support\Facades\Storage;

/**
 * 商品マスタコントローラー
 */
class ItemController extends Controller
{
    /** @var \App\Api\Item\Services\ItemPdfService */
    protected $service;

  public function __construct(ItemPdfService $service)
  {
    $this->service = $service;
  }

  public function output(string $file_id)
  {
  $path = $this->service->getStoragePath($file_id);
  if (!Storage::exists($path)) {
    abort(404);
  }
  return response(Storage::get($path))
    ->header('Content-Type', 'application/pdf')
    ->header('Content-Disposition', 'attachment; filename*=UTF-8\'\'' . rawurlencode("ラベル.pdf"));
  }

  /**
   * エクセル出力
   */
  public function output_excel(string $file_id)
  {
    $pdf = new ItemExcelService();
    $path = $pdf->getStoragePath($file_id);
    if (!Storage::exists($path)) {
      abort(404);
    }

    return response(Storage::get($path))
      ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ->header('Content-Disposition', 'inline; filename="' . "商品マスタ.xlsx" . '"');
  }
}
