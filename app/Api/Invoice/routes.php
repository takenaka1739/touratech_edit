<?php

namespace App\Api\Invoice\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/invoice',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('fetch', [InvoiceController::class, 'fetch']);
  Route::post('validate_closing', [InvoiceController::class, 'validate_closing']);
  Route::post('closing', [InvoiceController::class, 'closing']);
  Route::post('cancel_closing', [InvoiceController::class, 'cancel_closing']);
  Route::post('output_invoice', [InvoiceController::class, 'output_invoice']);
  Route::post('output_list', [InvoiceController::class, 'output_list']);
});
