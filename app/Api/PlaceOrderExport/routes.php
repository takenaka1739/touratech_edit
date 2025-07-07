<?php

namespace App\Api\PlaceOrderExport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/place_order_export',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('/output', [PlaceOrderExportController::class, 'output']);
});
