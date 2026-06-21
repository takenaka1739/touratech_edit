<?php

use App\Api\ShippingRate\Controllers\ShippingRateController;
use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => 'api/shipping_rate',
    'middleware' => ['api', 'auth', 'check.admin'],
], function () {
    Route::get('/', [ShippingRateController::class, 'index']);
    Route::put('/edit', [ShippingRateController::class, 'update']);
});
