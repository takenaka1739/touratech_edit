<?php

use Illuminate\Support\Facades\Route;
use App\Api\Coupon\Controllers\CouponController;
use App\Api\Coupon\Controllers\CouponOptionController;
use App\Api\Coupon\Controllers\ItemController;
use App\Api\Coupon\Controllers\ItemClassificationController;

Route::group([
  'prefix' => 'api/coupon',
  'middleware' => ['api', 'auth', 'check.general']
], function () {
  Route::get('selected/{id}', [CouponController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function () {
    Route::post('fetch', [CouponController::class, 'fetch']);
    Route::post('store', [CouponController::class, 'store']);
    Route::get('edit/{id}', [CouponController::class, 'edit']);
    Route::put('edit/{id}', [CouponController::class, 'update']);
    Route::delete('delete/{id}', [CouponController::class, 'delete']);
    Route::get('options/items', [CouponOptionController::class, 'items']);
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/item-classifications', [ItemClassificationController::class, 'index']);
  });
});
