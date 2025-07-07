<?php

namespace App\Api\Config\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/config',
  'middleware' => ['api', 'auth', 'check.admin']
], function() {
  Route::get('/', [ConfigController::class, 'index']);
  Route::put('/edit', [ConfigController::class, 'update']);
});
