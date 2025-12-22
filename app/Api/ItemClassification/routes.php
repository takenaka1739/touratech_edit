<?php

namespace App\Api\ItemClassification\Controllers;

use Illuminate\Support\Facades\Route;
Route::group([
  'prefix' => 'api/item_classification',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [ItemClassificationController::class, 'dialog']);
  Route::get('selected/{id}', [ItemClassificationController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    // 商品分類データベース
    Route::post('fetch',  [ItemClassificationController::class, 'fetch']);
    Route::post('store',  [ItemClassificationController::class, 'store']);
    Route::get('edit/{id}', [ItemClassificationController::class, 'edit']);
    Route::put('edit/{id}', [ItemClassificationController::class, 'update']);
    Route::delete('delete/{id}', [ItemClassificationController::class, 'delete']);

    // 商品分類用の画像
    Route::post('image_store',    [ImageController::class, 'store'])->name('images.store');     // 新規登録
    Route::put('image_edit/{id}', [ImageController::class, 'update'])->name('images.update');   // 更新
    Route::get('images',          [ImageController::class, 'list'])->name('images.list');       // 一覧取得
  });
});
