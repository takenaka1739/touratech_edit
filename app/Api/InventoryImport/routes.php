<?php

namespace App\Api\InventoryImport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/inventory_import',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('/fetch', [InventoryImportController::class, 'fetch']);
  Route::post('/validate_upload', [InventoryImportController::class, 'validate_upload']);
  Route::post('/upload', [InventoryImportController::class, 'upload']);
  Route::post('/detail', [InventoryImportController::class, 'detail']);
  Route::post('/output', [InventoryImportController::class, 'output']);
  Route::post('/confirm', [InventoryImportController::class, 'confirm']);
});
