<?php

namespace App\Api\Customer\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/customer',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [CustomerController::class, 'dialog']);
  Route::get('selected/{id}', [CustomerController::class, 'selected']);
  Route::post('simple_store', [CustomerController::class, 'simple_store']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch', [CustomerController::class, 'fetch']);
    Route::post('store', [CustomerController::class, 'store']);
    Route::get('edit/{id}', [CustomerController::class, 'edit']);
    Route::put('edit/{id}', [CustomerController::class, 'update']);
    Route::delete('delete/{id}', [CustomerController::class, 'delete']);
    Route::post('output_excel', [CustomerController::class, 'output_excel']);
  });
});
