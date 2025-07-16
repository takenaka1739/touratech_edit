<?php

namespace App\Api\Coupon;

use Illuminate\Support\ServiceProvider;

class CouponServiceProvider extends ServiceProvider
{
  public function boot()
  {
    $this->loadRoutesFrom(__DIR__ . '/routes.php');
  }
}
