<?php

namespace App\Api\ReceiveOrderStatus\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/receive_order_status',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('fetch', [ReceiveOrderStatusController::class, 'fetch']);
});
