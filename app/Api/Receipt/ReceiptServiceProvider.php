<?php

namespace App\Api\Receipt;

use Illuminate\Support\ServiceProvider;

class ReceiptServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}