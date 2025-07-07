<?php

namespace App\Api\PlaceOrder\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/place_order',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [PlaceOrderController::class, 'dialog']);
  Route::get('selected/{id}', [PlaceOrderController::class, 'selected']);
  Route::get('selected_for_purchase/{id}', [PlaceOrderController::class, 'selected_for_purchase']);
  Route::post('fetch', [PlaceOrderController::class, 'fetch']);
  Route::post('store', [PlaceOrderController::class, 'store']);
  Route::get('edit/{id?}', [PlaceOrderController::class, 'edit']);
  Route::get('edit_by_receive_id/{id}', [PlaceOrderController::class, 'edit_by_receive_id']);
  Route::put('edit/{id}', [PlaceOrderController::class, 'update']);
  Route::delete('delete/{id}', [PlaceOrderController::class, 'delete']);
  Route::post('detail', [PlaceOrderController::class, 'detail']);
  Route::post('get_mail', [PlaceOrderController::class, 'get_mail']);
  Route::post('sending_mail', [PlaceOrderController::class, 'sending_mail']);
});
