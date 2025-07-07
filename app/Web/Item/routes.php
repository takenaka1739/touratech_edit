<?php

namespace App\Web\Item\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/item',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [ItemController::class, 'output']);
  Route::get('/output_excel/{file_id}', [ItemController::class, 'output_excel']);
});
