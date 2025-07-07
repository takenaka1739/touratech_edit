<?php

namespace Tests\Api\Estimate\Services;

use App\Api\Estimate\Services\EstimateService;
use App\Base\Models\EstimateDetail;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class EstimateServiceUpdateSetItemsTest extends TestCase
{
  /** @var \App\Api\Estimate\Services\EstimateService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new EstimateService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('updateSetItems');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('estimate_details')->delete();
    DB::table('set_item_details')->delete();

    DB::table('estimate_details')->insert([[
      'id' => 1,
      'estimate_id' => 1,
      'no' => 1,
      'item_kind' => 1,
      'item_id' => 1,
      'item_number' => "01-001-0001-0",
      'item_name' => 'item01',
      'item_name_jp' => 'item_jp01',
      'sales_unit_price' => 501,
      'rate' => 100,
      'fraction' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'amount' => 2001,
      'sales_tax_rate' => 10,
      'sales_tax' => 200,
      'parent_id' => null,
    ],[
      'id' => 2,
      'estimate_id' => 1,
      'no' => 2,
      'item_kind' => 2,
      'item_id' => 2,
      'item_number' => "01-001-0001-0",
      'item_name' => 'item01',
      'item_name_jp' => 'item_jp01',
      'sales_unit_price' => 501,
      'rate' => 100,
      'fraction' => 1,
      'unit_price' => 1001,
      'quantity' => 21,
      'amount' => 2001,
      'sales_tax_rate' => 10,
      'sales_tax' => 200,
      'parent_id' => null,
    ],[
      'id' => 3,
      'estimate_id' => 1,
      'no' => 3,
      'item_kind' => 3,
      'item_id' => 1,
      'item_number' => "01-001-0001-0",
      'item_name' => 'item01',
      'item_name_jp' => 'item_jp01',
      'sales_unit_price' => 501,
      'rate' => 101,
      'fraction' => 1,
      'unit_price' => 1001,
      'quantity' => 23,
      'amount' => 2001,
      'sales_tax_rate' => 10,
      'sales_tax' => 201,
      'parent_id' => 2,
    ],[
      'id' => 4,
      'estimate_id' => 1,
      'no' => 4,
      'item_kind' => 3,
      'item_id' => 2,
      'item_number' => "01-001-0002-0",
      'item_name' => 'item02',
      'item_name_jp' => 'item_jp02',
      'sales_unit_price' => 502,
      'rate' => 102,
      'fraction' => 1,
      'unit_price' => 1002,
      'quantity' => 24,
      'amount' => 2002,
      'sales_tax_rate' => 10,
      'sales_tax' => 202,
      'parent_id' => 2,
    ]]);

    DB::table('set_item_details')->insert([[
      'set_item_id' => 2,
      'id' => 1,
      'item_id' => 1,
      'quantity' => 10,
      'set_price' => 300,
    ],[
      'set_item_id' => 2,
      'id' => 2,
      'item_id' => 2,
      'quantity' => 20,
      'set_price' => 500,
    ]]);
  }

  public function testSuccess()
  {
    $parent = DB::table('estimate_details')->where('id', '=', 2)->first();
    $this->method->invoke($this->service, $parent);

    $actual1 = DB::table('estimate_details')->where('id', "=", 3)->first()->toArray();
    Log::debug($actual1);
  }
}
