<?php

namespace App\Web\InventoryImport;

use Illuminate\Support\ServiceProvider;

class InventoryImportServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}