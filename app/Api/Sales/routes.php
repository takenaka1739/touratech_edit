<?php

use Illuminate\Support\Facades\Route;
use App\Api\Sales\Controllers\SalesController;
use App\Api\Sales\Controllers\SalesListController;
use App\Api\Sales\Controllers\SalesSquareController; //  追加

Route::group([
  'prefix' => 'api/sales',
  'middleware' => ['api', 'auth', 'check.general'],
], function () {

  // 一覧・CRUD
  Route::post('fetch', [SalesListController::class, 'fetch']);

  // 検索ダイアログ（必要に応じてフロント側から呼ぶ）
  Route::post('detail', [SalesController::class, 'detail']);

  // 詳細画面（新規/既存）
  Route::get('edit/', [SalesController::class, 'edit']);        // 新規（IDなし）
  Route::get('edit/{id}', [SalesController::class, 'edit']);    // 既存（IDあり）

  // 受注IDから売上初期データ生成
  Route::get('edit_by_receive_id/{id}', [SalesController::class, 'edit_by_receive_id']);

  // 作成/更新/削除・バリデーション
  //  ここを元のコントローラ指定に戻す（FormRequest を効かせる）
  Route::post('store', [SalesController::class, 'store']);

  Route::post('validate_edit/{id}', [SalesController::class, 'validate_edit']);
  Route::put('edit/{id}', [SalesController::class, 'update']);
  Route::delete('delete/{id}', [SalesController::class, 'delete']);

  // 帳票出力（コントローラ原型に合わせて分割）
  Route::post('output_delivery', [SalesController::class, 'output_delivery'])->name('api.sales.output_delivery');
  Route::post('output_invoice',  [SalesController::class, 'output_invoice'])->name('api.sales.output_invoice');
  Route::post('output_excel',    [SalesController::class, 'output_excel'])->name('api.sales.output_excel');

  /**
   * 互換用（既存フロントがあれば当面は残す）
   * - /api/sales/output_pdf/delivery → 納品書
   * - /api/sales/output_pdf/invoice  → 請求書
   */
  Route::post('output_pdf/{docType}', function (\Illuminate\Http\Request $req, string $docType) {
      $ctrl = app(SalesController::class);
      if ($docType === 'delivery' || $docType === '納品書') {
          return $ctrl->output_delivery($req);
      }
      if ($docType === 'invoice' || $docType === '請求書') {
          return $ctrl->output_invoice($req);
      }
      return response()->json(['success'=>false,'errors'=>['docType'=>'不正な帳票種別です']], 422);
  })->where('docType','delivery|invoice|納品書|請求書')->name('api.sales.output_pdf_compat');

  // ===== レガシーURL互換（現行フロントが叩いている経路） =====
  // POST /api/sales/output/delivery → 納品書PDF
  Route::post('output/delivery', [SalesController::class, 'output_delivery'])
      ->name('api.sales.output_delivery_legacy');

  // POST /api/sales/output/invoice → 請求書PDF
  Route::post('output/invoice', [SalesController::class, 'output_invoice'])
      ->name('api.sales.output_invoice_legacy');
  // =====================================================
});
