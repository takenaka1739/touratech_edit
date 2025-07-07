<?php

namespace App\Api\Receipt\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/receipt',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('fetch', [ReceiptController::class, 'fetch']);
  Route::post('store', [ReceiptController::class, 'store']);
  Route::get('edit/{id?}', [ReceiptController::class, 'edit']);
  Route::put('edit/{id}', [ReceiptController::class, 'update']);
  Route::delete('delete/{id}', [ReceiptController::class, 'delete']);
  Route::get('customer_selected/{id}', [ReceiptController::class, 'customer_selected']);
});
