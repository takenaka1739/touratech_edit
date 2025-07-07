<?php

namespace App\Api\User;

use Illuminate\Support\ServiceProvider;

class UserServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}