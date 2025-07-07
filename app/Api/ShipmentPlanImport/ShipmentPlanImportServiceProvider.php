<?php

namespace App\Api\ShipmentPlanImport;

use Illuminate\Support\ServiceProvider;

class ShipmentPlanImportServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}