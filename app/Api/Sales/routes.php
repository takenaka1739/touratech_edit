<?php

use Illuminate\Support\Facades\Route;
use App\Api\Sales\Controllers\SalesController;
use App\Api\Sales\Controllers\SalesListController;

Route::group([
  'prefix' => 'api/sales',
  'middleware' => ['api', 'auth', 'check.general'],
], function () {

  // 一覧
  Route::post('fetch', [SalesListController::class, 'fetch']);

  // 詳細（新規/既存/受注起点）
  Route::post('detail', [SalesController::class, 'dialog']);
  Route::get('edit/', [SalesController::class, 'edit']);        // 新規
  Route::get('edit/{id}', [SalesController::class, 'edit']);    // 既存
  Route::get('edit_by_receive_id/{id}', [SalesController::class, 'edit_by_receive_id']);

  // CRUD
  Route::post('store', [SalesController::class, 'store']);
  Route::post('validate_edit/{id}', [SalesController::class, 'validate_edit']);
  Route::put('edit/{id}', [SalesController::class, 'update']);
  Route::delete('delete/{id}', [SalesController::class, 'delete']);

  // 出力
  Route::post('output/delivery', [SalesController::class, 'output_delivery']);
  Route::post('output/invoice',  [SalesController::class, 'output_invoice']);
  Route::post('output_excel',    [SalesController::class, 'output_excel']);
});
