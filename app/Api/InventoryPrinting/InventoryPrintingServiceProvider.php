<?php

namespace App\Api\InventoryPrinting;

use Illuminate\Support\ServiceProvider;

class InventoryPrintingServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}