<?php

namespace App\Web\Invoice;

use Illuminate\Support\ServiceProvider;

class InvoiceServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__.'/routes.php');
  }
}