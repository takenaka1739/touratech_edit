<?php

namespace App\Api\info;

use Illuminate\Support\ServiceProvider;

class InfoServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadRoutesFrom(base_path('app/Api/info/routes.php'));
    }
}