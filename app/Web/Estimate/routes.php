<?php

namespace App\Web\Estimate\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/estimate',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [EstimateController::class, 'output']);
});
