<?php

namespace App\Web\Calendar\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/calendar',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [CalendarController::class, 'output']);
  Route::get('/output_excel/{file_id}', [CalendarController::class, 'output_excel']);
});
