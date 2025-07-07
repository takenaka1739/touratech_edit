<?php

namespace Tests\Base\Helpers;

use Tests\TestCase;
use App\Base\Models\Config;

class GetCutoffDateTest extends TestCase
{
  public function testGetCutoffDateSuccess()
  {
    $actual = get_cutoff_date('2021/01', 1);
    $expected = '2021/01/01';

    $this->assertEquals($expected, $actual);
  }

  public function testGetCutoffDateSuccess2()
  {
    $actual = get_cutoff_date('2021/01', 31);
    $expected = '2021/01/31';

    $this->assertEquals($expected, $actual);
  }

  public function testGetCutoffDateSuccess3()
  {
    $actual = get_cutoff_date('2021/02', 31);
    $expected = '2021/02/28';

    $this->assertEquals($expected, $actual);
  }

  public function testGetCutoffDateSuccess4()
  {
    $actual = get_cutoff_date('2021/02', "04");
    $expected = '2021/02/04';

    $this->assertEquals($expected, $actual);
  }

  public function testGetCutoffDateSuccess5()
  {
    $actual = get_cutoff_date('2021/02', "30");
    $expected = '2021/02/28';

    $this->assertEquals($expected, $actual);
  }

  public function testGetCutoffDateSuccess6()
  {
    $actual = get_cutoff_date('2021/6', "30");
    $expected = '2021/06/30';

    $this->assertEquals($expected, $actual);
  }

}