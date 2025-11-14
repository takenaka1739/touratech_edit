<?php

use Illuminate\Support\Facades\Route;
use App\Api\Calendar\Controllers\CalendarController;

Route::group([
  'prefix' => 'api/calendar',
  'middleware' => ['api', 'auth', 'check.general']
], function () {
  Route::get('selected/{id}', [CalendarController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function () {
    Route::post('fetch', [CalendarController::class, 'fetch']);
    Route::post('store', [CalendarController::class, 'store']);
    Route::get('edit/{id}', [CalendarController::class, 'edit']);
    Route::put('edit/{id}', [CalendarController::class, 'update']);
    Route::delete('delete/{id}', [CalendarController::class, 'delete']);
  });
});
