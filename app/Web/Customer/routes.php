<?php

namespace App\Web\Customer\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/customer',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output_excel/{file_id}', [CustomerController::class, 'output_excel']);
});
