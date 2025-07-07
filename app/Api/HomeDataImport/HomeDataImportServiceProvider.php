<?php

namespace App\Api\HomeDataImport;

use Illuminate\Support\ServiceProvider;

class HomeDataImportServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}