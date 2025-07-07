<?php

namespace App\Web\ReceiveOrder\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/receive_order',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [ReceiveOrderController::class, 'output']);
});
