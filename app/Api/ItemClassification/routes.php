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
    // ==============================================================
    // 商品分類用のルーティング
    // ==============================================================
    Route::post('fetch',  [ItemClassificationController::class, 'fetch']);
    Route::post('store',  [ItemClassificationController::class, 'store']);
    Route::get('edit/{id}', [ItemClassificationController::class, 'edit']);
    Route::put('edit/{id}', [ItemClassificationController::class, 'update']);
    Route::delete('delete/{id}', [ItemClassificationController::class, 'delete']);

    // ==============================================================
    // 商品分類用の画像関連のルーティング
    // ==============================================================
    // ローカル画像アップロード & m_images 登録
    Route::post('image_store', [ImageController::class, 'store'])->name('images.store');

    // ローカル画像アップロード & m_images 更新
    Route::put('image_edit/{id}', [ImageController::class, 'update'])->name('images.update');

    // サーバー画像選択 & m_images 登録
    Route::post('image_store_meta', [ImageController::class, 'storeMeta'])->name('images.store.meta');

    // サーバー画像選択 & m_images 更新
    Route::put('image_edit_meta/{id}', [ImageController::class, 'updateMeta'])->name('images.update.meta');

    // サーバー画像の一覧取得
    Route::get('images', [ImageController::class, 'list'])->name('images.list');
  });
});
