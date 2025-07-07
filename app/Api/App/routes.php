<?php

namespace App\Api\App\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
    'prefix' => 'api/app',
    'middleware' => ['api', 'auth']
], function() {
    Route::get('/', [AppController::class, 'index']);
});
