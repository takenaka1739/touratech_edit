<?php

namespace Tests\Api\ShipmentPlan\Services;

use App\Api\ShipmentPlan\Services\ShipmentPlanService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class ShipmentPlanServiceGetPurchaseDataTest extends TestCase
{
  protected $service;
  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new ShipmentPlanService();
    $refrection = new ReflectionClass($this->service);
    $this->method = $refrection->getMethod('getPurchaseData');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('purchases')->truncate();
    DB::table('purchase_details')->truncate();

    DB::table('place_orders')->truncate();
    DB::table('place_order_details')->truncate();

    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        'id' => 21,
        'item_number' => '01-0001-001',
        'name' => 'item_name01',
        'name_jp' => '商品名01',
        'name_label' => '',
      ],
      [
        'id' => 22,
        'item_number' => '01-0002-001',
        'name' => 'item_name02',
        'name_jp' => '商品名02',
        'name_label' => '',
      ],
    ]);
  }

  public function testSuccessNoData()
  {
    $user_id = 1;
    $rows = [];
    $actual = $this->method->invoke($this->service, $user_id, $rows);
    $expected = [
      'data' => [],
      'details' => [],
      'link_p_order_purchase' => [],
      'link_p_order_purchase_detail' => [],
      'moves' => [],
    ];

    $this->assertEquals($expected, $actual);
  }
  
  public function testSuccess1()
  {
    $user_id = 100;
    $rows = [
      [
        'id' => 10,
        'shipment_plan_date' => '2021/11/01',
        'item_number' => '01-0001-001',
        'unit_price' => 1001,
        'quantity' => 2,
        'amount' => 2002,
        'item_id' => 21,
        'place_order_id' => null,
        'place_order_detail_id' => null,
      ],
    ];
    $actual = $this->method->invoke($this->service, $user_id, $rows);
    $expected = [
      'data' => [
        [
          'id' => 1,
          'purchase_date' => '2021/11/01',
          'user_id' => 100,
          'total_amount' => 2002,
        ]
      ],
      'details' => [
        [
          'id' => 1,
          'purchase_id' => 1,
          'no' => 1,
          'item_kind' => 1,
          'item_id' => 21,
          'item_number' => '01-0001-001',
          'item_name' => 'item_name01',
          'item_name_jp' => '商品名01',
          'unit_price' => 1001,
          'quantity' => 2,
          'amount' => 2002,
          'sales_tax' => 0,
          'shipment_plan_id' => 10,
        ],
      ],
      'link_p_order_purchase' => [],
      'link_p_order_purchase_detail' => [],
      'moves' => [
        [
          'job_date' => '2021/11/01',
          'detail_kind' => 1,
          'purchase_id' => 1,
          'item_number' => '01-0001-001',
          'quantity' => 2,
        ]
      ],
    ];

    $this->assertEquals($expected, $actual);
  }
  
  public function testSuccess2()
  {
    DB::table('purchases')->insert([
      'id' => 1020,
      'purchase_date' => '2021/01/01',
    ]);
    DB::table('purchase_details')->insert([
      'id' => 3201,
      'purchase_id' => 1020,
      'no' => 1,
      'item_kind' => 1,
      'item_id' => 21,
      'item_number' => '01-0001-001',
      'item_name' => 'item_name01',
      'unit_price' => 0,
      'quantity' => 0,
      'amount' => 0,
    ]);

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

    $user_id = 100;
    $rows = [
      [
        'id' => 10,
        'shipment_plan_date' => '2021/11/01',
        'item_number' => '01-0001-001',
        'unit_price' => 1001,
        'quantity' => 2,
        'amount' => 2002,
        'item_id' => 21,
        'place_order_id' => 2,
        'place_order_detail_id' => 21,
      ],
    ];
    $actual = $this->method->invoke($this->service, $user_id, $rows);
    $expected = [
      'data' => [
        [
          'id' => 1021,
          'purchase_date' => '2021/11/01',
          'user_id' => 100,
          'total_amount' => 2002,
        ]
      ],
      'details' => [
        [
          'id' => 3202,
          'purchase_id' => 1021,
          'no' => 1,
          'item_kind' => 1,
          'item_id' => 21,
          'item_number' => '01-0001-001',
          'item_name' => 'item_name01',
          'item_name_jp' => '商品名01',
          'unit_price' => 1001,
          'quantity' => 2,
          'amount' => 2002,
          'sales_tax' => 0,
          'shipment_plan_id' => 10,
        ],
      ],
      'link_p_order_purchase' => [
        [
          'place_order_id' => 2,
          'purchase_id' => 1021
        ],
      ],
      'link_p_order_purchase_detail' => [
        [
          'place_order_detail_id' => 21,
          'purchase_detail_id' => 3202
        ],
      ],
      'moves' => [
        [
          'job_date' => '2021/11/01',
          'detail_kind' => 1,
          'purchase_id' => 1021,
          'item_number' => '01-0001-001',
          'quantity' => 2,
        ]
      ],
    ];

    $this->assertEquals($expected, $actual);
  }
}