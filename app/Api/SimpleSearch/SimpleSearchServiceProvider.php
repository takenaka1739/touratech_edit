<?php

namespace App\Api\SimpleSearch;

use Illuminate\Support\ServiceProvider;

class SimpleSearchServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}