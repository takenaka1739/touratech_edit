<?php

namespace App\Api\ShippingRate;

use Illuminate\Support\ServiceProvider;

class ShippingRateServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadRoutesFrom(__DIR__ . '/routes.php');
    }
}
