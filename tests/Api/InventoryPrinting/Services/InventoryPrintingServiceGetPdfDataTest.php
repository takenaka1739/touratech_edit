<?php

namespace Tests\Api\InventoryPrinting\Services;

use App\Api\InventoryPrinting\Services\InventoryPrintingService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InventoryPrintingServiceGetPdfDataTest extends TestCase
{
  /** @var \App\Api\InventoryPrinting\Services\InventoryPrintingService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InventoryPrintingService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getPdfData');
    $this->method->setAccessible(true);

    DB::table('inventories')->delete();
    DB::table('inventory_moves')->delete();
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
      ],
    ]);
  }

  public function testSuccessNoData()
  {
    $actual = $this->method->invoke($this->service, ['import_month' => '2021/01']);

    $this->assertEquals([], $actual);
  }

  public function testSuccess1()
  {
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/06',
        'item_number' => '00-0000-0001',
        'quantity' => 100,
      ]
    ]);
    $actual = $this->method->invoke($this->service, ['import_month' => '2021/06']);
    $expected =  [
      [
        'item_number' => '00-0000-0001',
        'item_name' => '商品01',
        'pre_quantity' => 0,
        'in' => 0,
        'out' => 0,
        'quantity' => 0,
        'unit_price' => 1001,
        'amount' => 0,
      ],
    ];

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess2()
  {
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 1,
        'item_number' => '00-0000-0001',
        'quantity' => 2,
      ]
    ]);
    $actual = $this->method->invoke($this->service, ['import_month' => '2021/06']);
    $expected =  [
      [
        'item_number' => '00-0000-0001',
        'item_name' => '',
        'pre_quantity' => 0,
        'in' => 2,
        'out' => 0,
        'quantity' => 2,
        'unit_price' => 0,
        'amount' => 0,
      ],
    ];

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess3()
  {
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 100,
      ]
    ]);
    $actual = $this->method->invoke($this->service, ['import_month' => '2021/06']);
    $expected =  [
      [
        'item_number' => '00-0000-0001',
        'item_name' => '商品01',
        'pre_quantity' => 100,
        'in' => 0,
        'out' => 0,
        'quantity' => 100,
        'unit_price' => 1001,
        'amount' => 100100,
      ],
    ];

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess4()
  {
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 10,
      ],
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0002',
        'quantity' => 14,
      ],
      [
        'import_month' => '2021/06',
        'item_number' => '00-0000-0001',
        'quantity' => 8,
      ],
    ]);
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 1,
        'item_number' => '00-0000-0001',
        'quantity' => 7,
      ],
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 2,
        'item_number' => '00-0000-0001',
        'quantity' => 10,
      ],
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 1,
        'item_number' => '00-0000-0002',
        'quantity' => 6,
      ],
    ]);
    $actual = $this->method->invoke($this->service, ['import_month' => '2021/06']);
    $expected =  [
      [
        'item_number' => '00-0000-0001',
        'item_name' => '商品01',
        'pre_quantity' => 10,
        'in' => 7,
        'out' => 10,
        'quantity' => 7,
        'unit_price' => 1001,
        'amount' => 7007,
      ],
      [
        'item_number' => '00-0000-0002',
        'item_name' => '',
        'pre_quantity' => 14,
        'in' => 6,
        'out' => 0,
        'quantity' => 20,
        'unit_price' => 0,
        'amount' => 0,
      ],
    ];

    $this->assertEquals($expected, $actual);
  }

}