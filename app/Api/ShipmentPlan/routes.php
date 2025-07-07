<?php

namespace App\Api\ShipmentPlan\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/shipment_plan',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('fetch', [ShipmentPlanController::class, 'fetch']);
  Route::post('validate_bulk_purchase', [ShipmentPlanController::class, 'validate_bulk_purchase']);
  Route::post('bulk_purchase', [ShipmentPlanController::class, 'bulk_purchase']);
  Route::post('output', [ShipmentPlanController::class, 'output']);
});
