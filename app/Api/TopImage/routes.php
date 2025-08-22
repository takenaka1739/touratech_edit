<?php

use Illuminate\Support\Facades\Route;
use App\Api\TopImage\Controllers\TopImageController;
use App\Api\TopImage\Controllers\ImageController;

Route::prefix('TopImage')->group(function () {
    Route::get('/', [TopImageController::class, 'index']);
    Route::post('/', [TopImageController::class, 'store']);
    Route::patch('/{id}', [TopImageController::class, 'update']);
    Route::delete('/{id}', [TopImageController::class, 'destroy']);
    Route::patch('/{id}/toggle', [TopImageController::class, 'toggle']);
    Route::post('/reorder', [TopImageController::class, 'reorder']);
    Route::post('/sync', [TopImageController::class, 'sync']);
});

// 画像一覧
Route::get('/images', [ImageController::class, 'index']);
Route::post('/images/upload', [ImageController::class, 'upload']);