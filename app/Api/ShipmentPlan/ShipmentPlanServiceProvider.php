<?php

namespace App\Api\ShipmentPlan;

use Illuminate\Support\ServiceProvider;

class ShipmentPlanServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}