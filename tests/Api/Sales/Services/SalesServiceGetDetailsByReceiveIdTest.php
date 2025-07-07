<?php

namespace Tests\Api\Sales\Services;

use App\Api\Sales\Services\SalesService;
use App\Base\Models\SalesDetail;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class SalesServiceGetDetailsByReceiveIdTest extends TestCase
{
  /** @var \App\Api\Sales\Services\SalesService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new SalesService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getDetailsByReceiveId');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        'id' => 1,
        'item_number' => '00-0000-0001',
        'name' => '商品01',
        'purchase_unit_price' => 1001,
        'is_discontinued' => 0,
        'is_display' => 0,
        'is_set_item' => 0,
        'domestic_stock' => 1001,
      ],
      [
        'id' => 2,
        'item_number' => '00-0000-0002',
        'name' => '商品02',
        'purchase_unit_price' => 1002,
        'is_discontinued' => 0,
        'is_display' => 0,
        'is_set_item' => 0,
        'domestic_stock' => 102,
      ],
    ]);

    DB::table('receive_order_details')->delete();
    DB::table('receive_order_details')->insert([
      [
        'id' => 11,
        'receive_order_id' => 1,
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
        'quantity' => 201,
        'amount' => 2001,
        'sales_tax_rate' => 10,
        'sales_tax' => 200,
        'parent_id' => null,
        'sales_completed' => 0,
        'place_completed' => 0,
        'answer_date' => null,
      ],
      [
        'id' => 21,
        'receive_order_id' => 2,
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
        'quantity' => 201,
        'amount' => 2001,
        'sales_tax_rate' => 10,
        'sales_tax' => 201,
        'parent_id' => null,
        'sales_completed' => 0,
        'place_completed' => 0,
        'answer_date' => null,
      ],
      [
        'id' => 22,
        'receive_order_id' => 2,
        'no' => 2,
        'item_kind' => 2,
        'item_id' => 2,
        'item_number' => "01-001-0001-0",
        'item_name' => 'item01',
        'item_name_jp' => 'item_jp01',
        'sales_unit_price' => 502,
        'rate' => 100,
        'fraction' => 1,
        'unit_price' => 1002,
        'quantity' => 202,
        'amount' => 2002,
        'sales_tax_rate' => 10,
        'sales_tax' => 202,
        'parent_id' => null,
        'sales_completed' => 0,
        'place_completed' => 0,
        'answer_date' => null,
      ],
      [
        'id' => 23,
        'receive_order_id' => 2,
        'no' => 3,
        'item_kind' => 3,
        'item_id' => 1,
        'item_number' => "01-001-0001-0",
        'item_name' => 'item01',
        'item_name_jp' => 'item_jp01',
        'sales_unit_price' => 503,
        'rate' => 100,
        'fraction' => 1,
        'unit_price' => 1003,
        'quantity' => 203,
        'amount' => 2003,
        'sales_tax_rate' => 10,
        'sales_tax' => 203,
        'parent_id' => null,
        'sales_completed' => 0,
        'place_completed' => 0,
        'answer_date' => null,
      ],
      [
        'id' => 24,
        'receive_order_id' => 2,
        'no' => 4,
        'item_kind' => 1,
        'item_id' => 1,
        'item_number' => "01-001-0001-0",
        'item_name' => 'item01',
        'item_name_jp' => 'item_jp01',
        'sales_unit_price' => 504,
        'rate' => 100,
        'fraction' => 1,
        'unit_price' => 1004,
        'quantity' => 204,
        'amount' => 2004,
        'sales_tax_rate' => 10,
        'sales_tax' => 204,
        'parent_id' => null,
        'sales_completed' => 1,
        'place_completed' => 0,
        'answer_date' => null,
      ],
    ]);
  }

  public function testSuccess()
  {
    $actual = $this->method->invoke($this->service, 2);
    $expected = [
      [
        'receive_order_detail_id' => 21,
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
        'quantity' => 201,
        'amount' => 2001,
        'sales_tax_rate' => 10,
        'sales_tax' => 201,
      ],
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }
}
