<?php

namespace App\Api\ReceiveOrder;

use Illuminate\Support\ServiceProvider;

class ReceiveOrderServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}