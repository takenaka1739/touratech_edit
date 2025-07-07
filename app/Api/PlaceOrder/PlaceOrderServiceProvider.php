<?php

namespace App\Api\PlaceOrder;

use Illuminate\Support\ServiceProvider;

class PlaceOrderServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}