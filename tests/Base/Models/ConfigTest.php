<?php

namespace Tests\Base\Models;

use Tests\TestCase;
use App\Base\Models\Config;

class ConfigTest extends TestCase
{
  public function testGetSalesTaxRateSuccess()
  {
    $m = new Config([
      'sales_tax_rate' => 25.3,
      'pre_tax_rate' => 18.4,
      'tax_rate_change_date' => '2021/01/02'
    ]);
    $date = '2021/01/02';

    $actual = $m->getSalesTaxRate($date);
    $expected = 25.3;

    $this->assertEquals($expected, $actual);
  }

  public function testGetPreTaxRateSuccess()
  {
    $m = new Config([
      'sales_tax_rate' => 25.3,
      'pre_tax_rate' => 18.4,
      'tax_rate_change_date' => '2021/01/02'
    ]);
    $date = '2021/01/01';

    $actual = $m->getSalesTaxRate($date);
    $expected = 18.4;

    $this->assertEquals($expected, $actual);
  }

}