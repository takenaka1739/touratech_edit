<?php

namespace App\Api\Sales\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/sales',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [SalesController::class, 'dialog']);
  Route::post('fetch', [SalesController::class, 'fetch']);
  Route::post('store', [SalesController::class, 'store']);
  Route::get('edit/{id?}', [SalesController::class, 'edit']);
  Route::get('edit_by_receive_id/{id}', [SalesController::class, 'edit_by_receive_id']);
  Route::post('validate_edit/{id}', [SalesController::class, 'validate_edit']);
  Route::put('edit/{id}', [SalesController::class, 'update']);
  Route::delete('delete/{id}', [SalesController::class, 'delete']);
  Route::post('detail', [SalesController::class, 'detail']);
  Route::post('output/delivery', [SalesController::class, 'output_delivery']);
  Route::post('output/invoice', [SalesController::class, 'output_invoice']);
  Route::post('/output_excel', [SalesController::class, 'output_excel']);
});
