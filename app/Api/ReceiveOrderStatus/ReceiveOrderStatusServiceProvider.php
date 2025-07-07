<?php

namespace App\Api\ReceiveOrderStatus;

use Illuminate\Support\ServiceProvider;

class ReceiveOrderStatusServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}