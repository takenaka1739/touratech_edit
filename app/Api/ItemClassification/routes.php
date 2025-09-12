<?php

namespace App\Api\ItemClassification\Controllers;

use Illuminate\Support\Facades\Route;

  \Log::debug('デバッグ：ItemClassification.Route');

Route::group([
  'prefix' => 'api/item_classification',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [ItemClassificationController::class, 'dialog']);
  Route::get('selected/{id}', [ItemClassificationController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch',  [ItemClassificationController::class, 'fetch']);
    Route::post('store',  [ItemClassificationController::class, 'store']);
    Route::get('edit/{id}', [ItemClassificationController::class, 'edit']);
    Route::put('edit/{id}', [ItemClassificationController::class, 'update']);
    Route::delete('delete/{id}', [ItemClassificationController::class, 'delete']);

    // 画像：新規登録・更新
    Route::post('image_store',      [ImageController::class, 'store']);
    Route::put('image_edit/{id}',   [ImageController::class, 'update']);

    // 画像：一覧取得（既存画像から選択用）
    // 例) GET /api/item_classification/images?keyword=abc&page=1
    Route::get('images',            [ImageController::class, 'index']);
  });
});
