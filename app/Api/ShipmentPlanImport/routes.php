<?php

namespace App\Api\ShipmentPlanImport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/shipment_plan_import',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('/validation', [ShipmentPlanImportController::class, 'validation']);
  Route::post('/upload', [ShipmentPlanImportController::class, 'upload']);
});
