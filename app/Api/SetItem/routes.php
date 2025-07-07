<?php

namespace App\Api\SetItem\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/set_item',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [SetItemController::class, 'dialog']);
  Route::get('selected/{id}', [SetItemController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch', [SetItemController::class, 'fetch']);
    Route::post('store', [SetItemController::class, 'store']);
    Route::get('edit/{id}', [SetItemController::class, 'edit']);
    Route::put('edit/{id}', [SetItemController::class, 'update']);
    Route::delete('delete/{id}', [SetItemController::class, 'delete']);
    Route::post('detail', [SetItemController::class, 'detail']);
  });
});
