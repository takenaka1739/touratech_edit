<?php
// 更新: app/Api/PickupRanking/routes.php

use Illuminate\Support\Facades\Route;
use App\Api\PickupRanking\Controllers\PickupRankingController;

Route::group([
  'prefix' => 'api/pickup_ranking',
  'middleware' => ['api', 'auth', 'check.general']
], function () {

  Route::group([
    'middleware' => ['check.admin']
  ], function () {

    // 一覧（PV + 手動制御 合成結果）
    Route::post('fetch', [PickupRankingController::class, 'fetch']);

    // 詳細（手動制御レコード）
    Route::get('edit/{id}', [PickupRankingController::class, 'edit']);

    // 登録 / 更新（useCommonDetailPage 互換）
    Route::post('store', [PickupRankingController::class, 'store']);
    Route::put('edit/{id}', [PickupRankingController::class, 'update']);

    // 削除（useCommonDetailPage は /delete/{id} を叩く）
    Route::delete('delete/{id}', [PickupRankingController::class, 'delete']);

    // 並び替え（manual_priority 再採番）
    Route::post('reorder', [PickupRankingController::class, 'reorder']);

    // 有効/無効のトグル（手動ID）
    Route::post('toggle-active/{id}', [PickupRankingController::class, 'toggleActive']);

    // ★追加：PV由来（item_code）でも有効/無効できる
    Route::post('toggle-active-by-code', [PickupRankingController::class, 'toggleActiveByCode']);

    // ★追加：手動（ID）を指定位置へ移動（表示順入力用）
    Route::post('move', [PickupRankingController::class, 'move']);

    // 商品情報（選択後の表示用）
    Route::get('item/{id}', [PickupRankingController::class, 'item']);

    // 商品検索（モーダル一覧用）
    Route::get('items', [PickupRankingController::class, 'items']);
  });
});
