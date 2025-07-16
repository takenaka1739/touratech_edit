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
});

// ← prefix外で追加
Route::get('/images', [ImageController::class, 'index']);
