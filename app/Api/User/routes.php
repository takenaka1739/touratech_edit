<?php

namespace App\Api\User\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/user',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [UserController::class, 'dialog']);
  Route::get('selected/{id}', [UserController::class, 'selected']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('fetch', [UserController::class, 'fetch']);
    Route::post('store', [UserController::class, 'store']);
    Route::get('edit/{id}', [UserController::class, 'edit']);
    Route::put('edit/{id}', [UserController::class, 'update']);
    Route::delete('delete/{id}', [UserController::class, 'delete']);
  });
});
