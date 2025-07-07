<?php

namespace App\Api\Purchase\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/purchase',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('fetch', [PurchaseController::class, 'fetch']);
  Route::post('store', [PurchaseController::class, 'store']);
  Route::get('edit/{id?}', [PurchaseController::class, 'edit']);
  Route::put('edit/{id}', [PurchaseController::class, 'update']);
  Route::delete('delete/{id}', [PurchaseController::class, 'delete']);
  Route::post('detail', [PurchaseController::class, 'detail']);
});
