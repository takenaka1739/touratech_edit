<?php

namespace App\Api\Hiden\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/hiden',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('/output/B2', [HidenController::class, 'outputB2']);
  Route::post('/output/Hiden', [HidenController::class, 'outputHiden']);
});
