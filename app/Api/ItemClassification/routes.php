<?php

namespace App\Api\ItemClassification\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/item_classification',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [ItemClassificationController::class, 'dialog']);
  Route::get('selected/{id}', [ItemClassificationController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch', [ItemClassificationController::class, 'fetch']);
    Route::post('store', [ItemClassificationController::class, 'store']);
    Route::get('edit/{id}', [ItemClassificationController::class, 'edit']);
    Route::put('edit/{id}', [ItemClassificationController::class, 'update']);
    Route::delete('delete/{id}', [ItemClassificationController::class, 'delete']);
  });
});
