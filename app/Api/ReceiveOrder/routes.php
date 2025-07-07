<?php

namespace App\Api\ReceiveOrder\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/receive_order',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [ReceiveOrderController::class, 'dialog']);
  Route::get('selected/{id}', [ReceiveOrderController::class, 'selected']);
  Route::get('selected_for_sales/{id}', [ReceiveOrderController::class, 'selected_for_sales']);
  Route::get('selected_for_place/{id}', [ReceiveOrderController::class, 'selected_for_place']);
  Route::post('fetch', [ReceiveOrderController::class, 'fetch']);
  Route::post('store', [ReceiveOrderController::class, 'store']);
  Route::get('edit/{id?}', [ReceiveOrderController::class, 'edit']);
  Route::put('edit/{id}', [ReceiveOrderController::class, 'update']);
  Route::post('validate_delete/{id}', [ReceiveOrderController::class, 'validate_delete']);
  Route::delete('delete/{id}', [ReceiveOrderController::class, 'delete']);
  Route::post('detail', [ReceiveOrderController::class, 'detail']);
  Route::post('output', [ReceiveOrderController::class, 'output']);
});
