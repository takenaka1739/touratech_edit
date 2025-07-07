<?php

namespace Tests\Api\ReceiveOrderStatus\Services;

use App\Api\ReceiveOrderStatus\Services\ReceiveOrderStatusService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class ReceiveOrderStatusServiceGetReceiveOrderStatusTest extends TestCase
{
  /** @var \App\Api\ReceiveOrderStatus\Services\ReceiveOrderStatusService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new ReceiveOrderStatusService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getReceiveOrderStatus');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        'id' => 1,
        'item_number' => '01-000-0001-0',
        'name' => 'ITEM01',
        'name_jp' => '商品01',
        'is_discontinued' => 0,
        'is_display' => 1,
        'is_set_item' => 0,
        'domestic_stock' => 101,
      ],
      [
        'id' => 2,
        'item_number' => '01-000-0002-0',
        'name' => 'ITEM02',
        'name_jp' => '商品02',
        'is_discontinued' => 0,
        'is_display' => 1,
        'is_set_item' => 0,
        'domestic_stock' => 102,
      ],
    ]);

    DB::table('receive_order_details')->delete();
    DB::table('receive_orders')->delete();
    DB::table('receive_orders')->insert([
      [
        'id' => 1,
        'receive_order_date' => '2021/02/03',
        'customer_name' => '得意先01',
        'tel' => '',
        'corporate_class' => 1,
        'total_amount' => 101,
      ],
      [
        'id' => 2,
        'receive_order_date' => '2021/02/02',
        'customer_name' => '得意先02',
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 102,
      ],
      [
        'id' => 3,
        'receive_order_date' => '2021/02/04',
        'customer_name' => '得意先03',
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 103,
      ],
      [
        'id' => 4,
        'receive_order_date' => '2021/02/04',
        'customer_name' => '得意先04',
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 104,
      ],
    ]);
    DB::table('receive_order_details')->insert([
      [
        'id' => 11,
        'receive_order_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 101,
        'quantity' => 11,
        'sales_completed' => 0,
      ],
      [
        'id' => 21,
        'receive_order_id' => 2,
        'no' => 1,
        'item_kind' => 2,
        'item_id' => 1,
        'unit_price' => 201,
        'quantity' => 21,
        'sales_completed' => 0,
      ],
      [
        'id' => 22,
        'receive_order_id' => 2,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 202,
        'quantity' => 22,
        'sales_completed' => 1,
      ],
      [
        'id' => 31,
        'receive_order_id' => 3,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 301,
        'quantity' => 31,
        'sales_completed' => 0,
      ],
      [
        'id' => 41,
        'receive_order_id' => 4,
        'no' => 1,
        'item_kind' => 2,
        'item_id' => 1,
        'unit_price' => 401,
        'quantity' => 41,
        'sales_completed' => 1,
      ],
    ]);

  }

  public function testSuccessNoData()
  {
    DB::table('receive_order_details')->delete();
    DB::table('receive_orders')->delete();

    $actual = $this->method->invoke($this->service);

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccess()
  {
    $actual = $this->method->invoke($this->service);
    $expected = [
      [
        'id' => 3,
        'receive_order_date' => '2021/02/04',
        'customer_name' => '得意先03',
        'receive_order_detail_id' => 31,
        'quantity' => 31,
        'item_number' => '01-000-0001-0',
        'item_name' => 'ITEM01',
        'item_name_jp' => '商品01',
        'domestic_stock' => 101,
      ],
      [
        'id' => 1,
        'receive_order_date' => '2021/02/03',
        'customer_name' => '得意先01',
        'receive_order_detail_id' => 11,
        'quantity' => 11,
        'item_number' => '01-000-0001-0',
        'item_name' => 'ITEM01',
        'item_name_jp' => '商品01',
        'domestic_stock' => 101,
      ],
      [
        'id' => 2,
        'receive_order_date' => '2021/02/02',
        'customer_name' => '得意先02',
        'receive_order_detail_id' => 21,
        'quantity' => 21,
        'item_number' => '01-000-0001-0',
        'item_name' => 'ITEM01',
        'item_name_jp' => '商品01',
        'domestic_stock' => 101,
      ],
      [
        'id' => 2,
        'receive_order_date' => '2021/02/02',
        'customer_name' => '得意先02',
        'receive_order_detail_id' => 22,
        'quantity' => 22,
        'item_number' => '01-000-0002-0',
        'item_name' => 'ITEM02',
        'item_name_jp' => '商品02',
        'domestic_stock' => 102,
      ],
    ];

    $this->assertEquals($expected, $actual->toArray());
  }

}