<?php

namespace App\Api\ItemClassification;

use Illuminate\Support\ServiceProvider;

class ItemClassificationServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}