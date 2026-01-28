<?php

namespace App\Api\PickupRanking;

use Illuminate\Support\ServiceProvider;

class PickupRankingServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}