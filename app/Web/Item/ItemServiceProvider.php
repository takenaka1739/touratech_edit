<?php

namespace App\Web\Item;

use Illuminate\Support\ServiceProvider;

class ItemServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}