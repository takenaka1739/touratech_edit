<?php

namespace App\Web\HomeDataImport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/home_data_import',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_name}', [HomeDataImportController::class, 'output']);
});
