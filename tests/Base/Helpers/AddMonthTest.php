<?php

namespace Tests\Base\Helpers;

use Tests\TestCase;

class AddMonthTest extends TestCase
{
  public function testSuccess()
  {
    $actual = add_month('2022/01');
    $expected = '2022/02';

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess2()
  {
    $actual = add_month('2022/11');
    $expected = '2022/12';

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess3()
  {
    $actual = add_month('2022/12');
    $expected = '2023/01';

    $this->assertEquals($expected, $actual);
  }
}