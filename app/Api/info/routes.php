<?php

use Illuminate\Support\Facades\Route;
use App\Api\info\Controllers\InfoController;

Route::group([
    'prefix'     => 'api/info',
    'middleware' => ['api', 'auth', 'check.general'],
], function () {

    // 投稿一覧
    Route::get('posts', [InfoController::class, 'index']);
    Route::post('posts', [InfoController::class, 'store']);
    Route::put('posts/{id}', [InfoController::class, 'update'])->whereNumber('id');
    Route::delete('posts/{id}', [InfoController::class, 'destroy'])->whereNumber('id');

    // 商品検索（Items用）
    Route::get('items', [InfoController::class, 'searchItems']);

    // カテゴリ選択用（カテゴリ1つを選ぶモーダル）
    Route::get('categories', [InfoController::class, 'searchCategories']);
});
