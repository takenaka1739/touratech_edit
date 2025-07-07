<?php

namespace Tests\Base\Helpers;

use Tests\TestCase;

class CalcUnitPriceTest extends TestCase
{
  const FRACTION_FLOOR = 1;
  const FRACTION_CEIL = 2;
  const FRACTION_ROUND = 3;

  public function testCalcUnitPriceFloor1()
  {
    $actual = calc_unit_price(0, 100, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 0);
  }

  public function testCalcUnitPriceFloor2()
  {
    $actual = calc_unit_price(80, 100, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 80);
  }

  public function testCalcUnitPriceFloor3()
  {
    $actual = calc_unit_price(100, 80, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 80);
  }

  public function testCalcUnitPriceFloor4()
  {
    $actual = calc_unit_price(20.42, 100, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 20.42);
  }

  public function testCalcUnitPriceFloor5()
  {
    $actual = calc_unit_price(20.42, 80, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 16.33);
  }

  public function testCalcUnitPriceFloor6()
  {
    $actual = calc_unit_price(20.425, 100, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 20.42);
  }

  public function testCalcUnitPriceFloor7()
  {
    $actual = calc_unit_price(20.425, 80, self::FRACTION_FLOOR);

    $this->assertEquals($actual, 16.34);
  }


  public function testCalcUnitPriceCeil1()
  {
    $actual = calc_unit_price(20.42, 100, self::FRACTION_CEIL);

    $this->assertEquals($actual, 20.42);
  }

  public function testCalcUnitPriceCeil2()
  {
    $actual = calc_unit_price(20.42, 80, self::FRACTION_CEIL);

    $this->assertEquals($actual, 16.34);
  }

  public function testCalcUnitPriceCeil3()
  {
    $actual = calc_unit_price(20.425, 100, self::FRACTION_CEIL);

    $this->assertEquals($actual, 20.43);
  }

  public function testCalcUnitPriceCeil4()
  {
    $actual = calc_unit_price(20.425, 80, self::FRACTION_CEIL);

    $this->assertEquals($actual, 16.34);
  }



  public function testCalcUnitPriceRound1()
  {
    $actual = calc_unit_price(20.42, 100, self::FRACTION_ROUND);

    $this->assertEquals($actual, 20.42);
  }

  public function testCalcUnitPriceRound2()
  {
    $actual = calc_unit_price(20.42, 80, self::FRACTION_ROUND);

    $this->assertEquals($actual, 16.34);
  }

  public function testCalcUnitPriceRound3()
  {
    $actual = calc_unit_price(20.424, 100, self::FRACTION_ROUND);

    $this->assertEquals($actual, 20.42);
  }

  public function testCalcUnitPriceRound4()
  {
    $actual = calc_unit_price(20.425, 100, self::FRACTION_ROUND);

    $this->assertEquals($actual, 20.43);
  }

  public function testCalcUnitPriceRound5()
  {
    $actual = calc_unit_price(20.425, 80, self::FRACTION_ROUND);

    $this->assertEquals($actual, 16.34);
  }

}