<?php

namespace App\Api\SimpleSearch\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/simple_search',
  'middleware' => ['api', 'auth']
], function() {
  Route::post('get', [SimpleSearchController::class, 'get']);
});
