<?php

namespace App\Api\ShopMail;

use Illuminate\Support\ServiceProvider;

class ShopMailProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/routes.php');
    }
}
