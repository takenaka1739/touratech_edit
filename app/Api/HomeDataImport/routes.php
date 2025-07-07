<?php

namespace App\Api\HomeDataImport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/home_data_import',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('/upload', [HomeDataImportController::class, 'upload']);
  Route::post('/output', [HomeDataImportController::class, 'output']);
});
