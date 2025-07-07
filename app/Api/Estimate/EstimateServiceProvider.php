<?php

namespace App\Api\Estimate;

use Illuminate\Support\ServiceProvider;

class EstimateServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}