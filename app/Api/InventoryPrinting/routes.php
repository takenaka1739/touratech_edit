<?php

namespace App\Api\InventoryPrinting\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/inventory_printing',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('/print', [InventoryPrintingController::class, 'print']);
  Route::post('/output', [InventoryPrintingController::class, 'output']);
});
