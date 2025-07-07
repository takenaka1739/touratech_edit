<?php

namespace App\Api\SetItem;

use Illuminate\Support\ServiceProvider;

class SetItemServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}