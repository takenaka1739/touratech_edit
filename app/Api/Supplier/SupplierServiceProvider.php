<?php

namespace App\Api\Supplier;

use Illuminate\Support\ServiceProvider;

class SupplierServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}