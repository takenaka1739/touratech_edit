<?php

namespace App\Web\InventoryPrinting\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/inventory_printing',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/print/{file_id}', [InventoryPrintingController::class, 'print']);
  Route::get('/output/{file_id}', [InventoryPrintingController::class, 'output']);
});
