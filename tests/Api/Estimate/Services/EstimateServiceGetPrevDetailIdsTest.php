<?php

namespace Tests\Api\Estimate\Services;

use App\Api\Estimate\Services\EstimateService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class EstimateServiceGetPrevDetailIdsTest extends TestCase
{
  /** @var \App\Api\Estimate\Services\EstimateService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new EstimateService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getPrevDetailIds');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('estimate_details')->delete();
    DB::table('estimate_details')->insert([[
      'id' => 11,
      'estimate_id' => 1,
      'no' => 1,
      'item_kind' => 1,
      'item_number' => "01-001-0001-0",
      'item_id' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'parent_id' => null,
    ], [
      'id' => 12,
      'estimate_id' => 1,
      'no' => 2,
      'item_kind' => 1,
      'item_number' => "01-001-0002-0",
      'item_id' => 2,
      'unit_price' => 1002,
      'quantity' => 22,
      'parent_id' => null,
    ], [
      'id' => 21,
      'estimate_id' => 2,
      'no' => 1,
      'item_kind' => 1,
      'item_number' => "01-001-0001-0",
      'item_id' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'parent_id' => null,
    ], [
      'id' => 31,
      'estimate_id' => 3,
      'no' => 1,
      'item_kind' => 1,
      'item_number' => "01-001-0001-0",
      'item_id' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'parent_id' => null,
    ], [
      'id' => 32,
      'estimate_id' => 3,
      'no' => 1,
      'item_kind' => 2,
      'item_number' => "01-001-0001-0",
      'item_id' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'parent_id' => null,
    ], [
      'id' => 33,
      'estimate_id' => 3,
      'no' => 1,
      'item_kind' => 3,
      'item_number' => "01-001-0001-0",
      'item_id' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'parent_id' => 32,
    ]]);
  }

  protected function tearDown(): void
  {
    parent::tearDown();

    // DB::statement('SET FOREIGN_KEY_CHECKS=1;');
  }

  public function testSuccessNoData()
  {
    DB::table('estimate_details')->delete();

    $actual = $this->method->invoke($this->service, 1);

    $this->assertEquals([], $actual);
  }

  public function testSuccessNoData2()
  {
    $actual = $this->method->invoke($this->service, 99);

    $this->assertEquals([], $actual);
  }

  public function testSuccess1()
  {
    $actual = $this->method->invoke($this->service, 1);

    $this->assertEquals([11, 12], $actual);
  }

  public function testSuccess2()
  {
    $actual = $this->method->invoke($this->service, 2);

    $this->assertEquals([21], $actual);
  }

  public function testSuccess3()
  {
    $actual = $this->method->invoke($this->service, 3);

    $this->assertEquals([31, 32], $actual);
  }

}