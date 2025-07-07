<?php

namespace Tests\Api\Estimate\Services;

use App\Api\Estimate\Services\EstimateService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class EstimateServiceDeleteDetailsTest extends TestCase
{
  /** @var \App\Api\Estimate\Services\EstimateService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new EstimateService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('deleteDetails');
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

    $details = [];
    $this->method->invoke($this->service, 1, $details);

    $count = DB::table('estimate_details')->count();
    $this->assertEquals(0, $count);
  }

  public function testSuccessNoData2()
  {
    $details = [[
      'id' => 11,
    ],[
      'id' => 12,
    ]];
    $this->method->invoke($this->service, 1, $details);

    $count = DB::table('estimate_details')->count();
    $this->assertEquals(6, $count);
  }

  public function testSuccess()
  {
    $details = [[
      'id' => 12,
    ]];
    $this->method->invoke($this->service, 1, $details);

    $count = DB::table('estimate_details')->count();
    $this->assertEquals(5, $count);
  }

  public function testSuccess2()
  {
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    $details = [[
      'id' => 31,
    ]];
    $this->method->invoke($this->service, 3, $details);

    $count = DB::table('estimate_details')->count();
    $this->assertEquals(4, $count);
  }

}