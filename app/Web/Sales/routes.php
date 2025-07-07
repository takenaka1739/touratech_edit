<?php

namespace App\Web\Sales\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/sales',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/delivery/{file_id}', [SalesController::class, 'output_delivery']);
  Route::get('/output/invoice/{file_id}', [SalesController::class, 'output_invoice']);
  Route::get('/output_excel/{file_id}', [SalesController::class, 'output_excel']);

});
