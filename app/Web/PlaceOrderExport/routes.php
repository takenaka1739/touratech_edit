<?php

namespace App\Web\PlaceOrderExport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/place_order_export',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_name}', [PlaceOrderExportController::class, 'output']);
});
