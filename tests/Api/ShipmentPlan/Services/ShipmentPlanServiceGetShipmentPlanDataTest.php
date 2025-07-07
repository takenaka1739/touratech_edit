<?php

namespace Tests\Api\ShipmentPlan\Services;

use App\Api\ShipmentPlan\Services\ShipmentPlanService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class ShipmentPlanServiceGetShipmentPlanDataTest extends TestCase
{
  protected $service;
  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new ShipmentPlanService();
    $refrection = new ReflectionClass($this->service);
    $this->method = $refrection->getMethod('getShipmentPlanData');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('place_orders')->delete();
    DB::table('place_order_details')->delete();

    DB::table('shipment_plans')->delete();
    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        'id' => 21,
        'item_number' => '01-0001-001',
        'name' => '',
        'name_jp' => '',
        'name_label' => '',
      ],
      [
        'id' => 22,
        'item_number' => '01-0002-001',
        'name' => '',
        'name_jp' => '',
        'name_label' => '',
      ],
    ]);
  }

  public function testSuccessNoData()
  {
    $cond = [
      'selected' => [],
      'c_shipment_plan_date_from' => '2021/01/01',
      'c_shipment_plan_date_to' => '2021/01/31',
    ];
    $actual = $this->method->invoke($this->service, $cond);

    $this->assertEquals([], $actual);
  }

  public function testSuccess1()
  {
    DB::table('shipment_plans')->insert([
      [
        'id' => 3,
        'shipment_plan_date' => '2021/01/02',
        'item_number' => '01-0001-001',
        'name' => 'テスト商品名01',
        'unit_price' => 100,
        'quantity' => 2,
        'amount' => 200,
      ],
      [
        'id' => 4,
        'shipment_plan_date' => '2021/01/05',
        'item_number' => '01-0001-001',
        'name' => 'テスト商品名01',
        'unit_price' => 102,
        'quantity' => 3,
        'amount' => 306,
      ],
    ]);

    $cond = [
      'selected' => [3],
      'c_shipment_plan_date_from' => '2021/01/01',
      'c_shipment_plan_date_to' => '2021/01/31',
    ];
    $actual = $this->method->invoke($this->service, $cond);
    $expected = [
      [
        'id' => 3,
        'shipment_plan_date' => '2021/01/02',
        'item_number' => '01-0001-001',
        'unit_price' => 100,
        'quantity' => 2,
        'amount' => 200,
        'item_id' => 21,
        'place_order_id' => null,
        'place_order_detail_id' => null,
      ]
    ];

    $this->assertEquals($expected, $actual);
  }
  
  public function testSuccess2()
  {
    DB::table('place_orders')->insert([
      [
        'id' => 1,
        'place_order_date' => '2021/11/11',
        'order_file_name' => 'order_1001_20211111.csv',
      ],
      [
        'id' => 2,
        'place_order_date' => '2021/11/11',
        'order_file_name' => 'order_1002_20211111.csv',
      ],
    ]);
    DB::table('place_order_details')->insert([
      [
        'id' => 11,
        'place_order_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 21,
        'item_number' => '01-0001-001',
        'unit_price' => 1,
        'quantity' => 1,
        'amount' => 1,
      ],
      [
        'id' => 21,
        'place_order_id' => 2,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 21,
        'item_number' => '01-0001-001',
        'unit_price' => 1,
        'quantity' => 1,
        'amount' => 1,
      ],
      [
        'id' => 22,
        'place_order_id' => 2,
        'no' => 2,
        'item_kind' => 1,
        'item_id' => 22,
        'item_number' => '01-0002-001',
        'unit_price' => 1,
        'quantity' => 1,
        'amount' => 1,
      ],
    ]);

    DB::table('shipment_plans')->insert([
      [
        'id' => 3,
        'shipment_plan_date' => '2021/01/02',
        'item_number' => '01-0001-001',
        'name' => 'テスト商品名01',
        'unit_price' => 100,
        'quantity' => 2,
        'amount' => 200,
        'place_order_no' => 'order_1002_20211111.csv',
      ],
      [
        'id' => 4,
        'shipment_plan_date' => '2021/01/05',
        'item_number' => '01-0001-001',
        'name' => 'テスト商品名01',
        'unit_price' => 102,
        'quantity' => 3,
        'amount' => 306,
        'place_order_no' => 'order_1002_20211111.csv',
      ],
    ]);

    $cond = [
      'selected' => [3],
      'c_shipment_plan_date_from' => '2021/01/01',
      'c_shipment_plan_date_to' => '2021/01/31',
    ];
    $actual = $this->method->invoke($this->service, $cond);
    $expected = [
      [
        'id' => 3,
        'shipment_plan_date' => '2021/01/02',
        'item_number' => '01-0001-001',
        'unit_price' => 100,
        'quantity' => 2,
        'amount' => 200,
        'item_id' => 21,
        'place_order_id' => 2,
        'place_order_detail_id' => 21,
      ]
    ];

    $this->assertEquals($expected, $actual);
  }
}
