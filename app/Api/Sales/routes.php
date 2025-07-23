<?php

use Illuminate\Support\Facades\Route;
use App\Api\Sales\Controllers\SalesController;
use App\Api\Sales\Controllers\SalesListController;

Route::group([
  'prefix' => 'api/sales',
  'middleware' => ['api', 'auth', 'check.general']
], function () {

  Route::post('fetch', [SalesListController::class, 'fetch']);
  Route::post('detail', [SalesController::class, 'detail']);

  // 新規作成用（IDなし）
  Route::get('edit/', [SalesController::class, 'create']); // ← 末尾スラッシュあり！

  // 編集用（IDあり）
  Route::get('edit/{id}', [SalesController::class, 'edit']);

});
