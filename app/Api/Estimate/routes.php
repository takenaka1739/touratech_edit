<?php

namespace App\Api\Estimate\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/estimate',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [EstimateController::class, 'dialog']);
  Route::get('selected/{id}', [EstimateController::class, 'selected']);
  Route::post('fetch', [EstimateController::class, 'fetch']);
  Route::post('store', [EstimateController::class, 'store']);
  Route::get('edit/{id?}', [EstimateController::class, 'edit']);
  Route::put('edit/{id}', [EstimateController::class, 'update']);
  Route::delete('delete/{id}', [EstimateController::class, 'delete']);
  Route::post('detail', [EstimateController::class, 'detail']);
  Route::post('output', [EstimateController::class, 'output']);
});
