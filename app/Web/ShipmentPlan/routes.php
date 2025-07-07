<?php

namespace App\Web\ShipmentPlan\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/shipment_plan',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [ShipmentPlanController::class, 'output']);
});
