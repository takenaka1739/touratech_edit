<?php

use Illuminate\Support\Facades\Route;
use App\Api\TopImage\Controllers\TopImageController;
use App\Api\TopImage\Controllers\ImageController;

/**
 * TopImage ルーティング
 * 注意: Laravel 12 では Route::middleware() にクロージャを直接渡すと
 * 「Object of class Closure could not be converted to string」になるため、
 * ここではミドルウェアを使わずに素直に定義します。
 */

// スライドショーマスタ（TopImage）
Route::prefix('TopImage')->group(function () {
    Route::get('/',               [TopImageController::class, 'index'])->name('topimage.index');
    Route::post('/',              [TopImageController::class, 'store'])->name('topimage.store');
    Route::patch('/{id}',         [TopImageController::class, 'update'])->name('topimage.update');
    Route::delete('/{id}',        [TopImageController::class, 'destroy'])->name('topimage.destroy');
    Route::patch('/{id}/toggle',  [TopImageController::class, 'toggle'])->name('topimage.toggle');
    Route::post('/reorder',       [TopImageController::class, 'reorder'])->name('topimage.reorder');
    Route::post('/sync',          [TopImageController::class, 'sync'])->name('topimage.sync');
});

// 画像一覧・アップロード
Route::get('/images',         [ImageController::class, 'index'])->name('topimage.images.index');
Route::post('/images/upload', [ImageController::class, 'upload'])->name('topimage.images.upload');
