<?php

namespace App\Api\info;

use Illuminate\Support\ServiceProvider;

class InfoServiceProvider extends ServiceProvider
{
    public function boot()
    {
        \Log::info('InfoServiceProvider boot実行');
        $this->loadRoutesFrom(base_path('app/Api/info/routes.php'));
    }
}