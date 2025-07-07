<?php

namespace App\Web\Invoice\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/invoice',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output_invoice/{file_id}', [InvoiceController::class, 'output_invoice']);
  Route::get('/output_list/{file_id}', [InvoiceController::class, 'output_list']);
});
