<?php

namespace App\Api\Item\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/item',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [ItemController::class, 'dialog']);
  Route::get('selected/{id}', [ItemController::class, 'selected']);
  Route::post('get_detail', [ItemController::class, 'get_detail']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch', [ItemController::class, 'fetch']);
    Route::post('store', [ItemController::class, 'store']);
    Route::get('edit/{id}', [ItemController::class, 'edit']);
    Route::put('edit/{id}', [ItemController::class, 'update']);
    Route::delete('delete/{id}', [ItemController::class, 'delete']);
    Route::post('output', [ItemController::class, 'output']);
    Route::post('get_id', [ItemController::class, 'get_id']);
    Route::post('/output_excel', [ItemController::class, 'output_excel']);
  });
});
