<?php

namespace App\Web\Hiden;

use Illuminate\Support\ServiceProvider;

class HidenServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}