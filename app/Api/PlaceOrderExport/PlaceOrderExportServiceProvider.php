<?php

namespace App\Api\PlaceOrderExport;

use Illuminate\Support\ServiceProvider;

class PlaceOrderExportServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}