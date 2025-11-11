<?php

use Illuminate\Support\Facades\Log;   // ★ 追加
use Illuminate\Support\Facades\Route;
use App\Api\info\Controllers\InfoController;
use App\Api\info\Controllers\InfoLookupController;

Log::info('[info/routes] file included'); // ★ 追加：ファイル読み込み確認

// 疎通確認用：/api/info/ping
Route::get('/api/info/ping', function () {
    Log::info('[info/routes] /api/info/ping hit'); // ★
    return response()->json(['pong' => true, 'ts' => now()->toDateTimeString()]);
});

// 本番API
Route::group([
    'prefix'     => 'api/info',
    'middleware' => ['api', 'auth', 'check.general'], // 必要に応じて 'api' のみに
], function () {
    Log::info('[info/routes] group registered'); // ★

    // 一覧
    Route::get('topics', [InfoController::class, 'indexShop']);
    Route::get('item-topics', [InfoController::class, 'indexProduct']);

    // 作成
    Route::post('topics', [InfoController::class, 'storeShop']);
    Route::post('item-topics', [InfoController::class, 'storeProduct']);

    // 更新
    Route::put('topics/{id}', [InfoController::class, 'updateShop']);
    Route::put('item-topics/{id}', [InfoController::class, 'updateProduct']);

    // 削除
    Route::delete('topics/{id}', [InfoController::class, 'destroyShop']);
    Route::delete('item-topics/{id}', [InfoController::class, 'destroyProduct']);

    // サジェスト
    Route::get('items/lookup', [InfoLookupController::class, 'items']);
});
