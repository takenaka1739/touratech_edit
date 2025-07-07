<?php

namespace Tests\Base\Helpers;

use Tests\TestCase;

class CalcAmountTest extends TestCase
{
  const FRACTION_FLOOR = 1;
  const FRACTION_CEIL = 2;
  const FRACTION_ROUND = 3;

  public function testCalcAmountFloor1()
  {
    [$amount, $sales_tax] = calc_amount(0, 0, 10, self::FRACTION_FLOOR);

    $this->assertEquals($amount, 0);
    $this->assertEquals($sales_tax, 0);
  }

  public function testCalcAmountFloor2()
  {
    [$amount, $sales_tax] = calc_amount(20, 3, 10, self::FRACTION_FLOOR);

    $this->assertEquals($amount, 60);
    $this->assertEquals($sales_tax, 5);
  }

  public function testCalcAmountFloor3()
  {
    [$amount, $sales_tax] = calc_amount(20.42, 10, 10, self::FRACTION_FLOOR);

    $this->assertEquals($amount, 204);
    $this->assertEquals($sales_tax, 18);
  }


  public function testCalcAmountCeil1()
  {
    [$amount, $sales_tax] = calc_amount(20, 3, 10, self::FRACTION_CEIL);

    $this->assertEquals($amount, 60);
    $this->assertEquals($sales_tax, 6);
  }

  public function testCalcAmountCeil2()
  {
    [$amount, $sales_tax] = calc_amount(20.42, 10, 10, self::FRACTION_CEIL);

    $this->assertEquals($amount, 205);
    $this->assertEquals($sales_tax, 19);
  }

  public function testCalcAmountCeil3()
  {
    [$amount, $sales_tax] = calc_amount(2.042, 10, 10, self::FRACTION_CEIL);

    $this->assertEquals($amount, 21);
    $this->assertEquals($sales_tax, 2);
  }

  public function testCalcAmountCeil4()
  {
    [$amount, $sales_tax] = calc_amount(0.07, 100, 10, self::FRACTION_CEIL);

    $this->assertEquals($amount, 7);
    $this->assertEquals($sales_tax, 1);
  }


  public function testCalcAmountRound1()
  {
    [$amount, $sales_tax] = calc_amount(20, 3, 10, self::FRACTION_ROUND);

    $this->assertEquals($amount, 60);
    $this->assertEquals($sales_tax, 5);
  }

  public function testCalcAmountRound2()
  {
    [$amount, $sales_tax] = calc_amount(20.42, 10, 10, self::FRACTION_ROUND);

    $this->assertEquals($amount, 204);
    $this->assertEquals($sales_tax, 19);
  }
}