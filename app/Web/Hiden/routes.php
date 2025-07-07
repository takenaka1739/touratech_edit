<?php

namespace App\Web\Hiden\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/hiden',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [HidenController::class, 'output']);
});
