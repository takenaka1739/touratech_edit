<?php

namespace App\Api\Supplier\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/supplier',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [SupplierController::class, 'dialog']);
  Route::get('selected/{id}', [SupplierController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch', [SupplierController::class, 'fetch']);
    Route::post('store', [SupplierController::class, 'store']);
    Route::get('edit/{id}', [SupplierController::class, 'edit']);
    Route::put('edit/{id}', [SupplierController::class, 'update']);
    Route::delete('delete/{id}', [SupplierController::class, 'delete']);
  });
});
