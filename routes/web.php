<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Base\Http\Controllers\Auth\LoginController;
use App\Base\Http\Controllers\HomeController;
use Illuminate\Support\Facades\File;

Auth::routes([
    'verify' => false,
    'register' => false,
    'reset' => false,
]);

Route::group([
    'middleware' => ['web', 'auth']
], function() {
    Route::get('assets/js/index.js', function () {
        return File::get(public_path(). '/assets/js/index.js');
    });
    Route::get('logout', [LoginController::class, 'logout'])->name('logout');
    Route::get('/{any}', [HomeController::class, 'index'])
        ->where('any', '^(?!(api|web)).*$')
        ->name('home');
});
