<?php

namespace App\Api\Sales;

use Illuminate\Support\ServiceProvider;

class SalesServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}