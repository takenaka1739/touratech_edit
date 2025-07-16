<?php

namespace App\Api\TopImage;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class TopImageServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Route::prefix('api')->group(function () {
            $this->loadRoutesFrom(__DIR__ . '/routes.php');
        });
    }
}
