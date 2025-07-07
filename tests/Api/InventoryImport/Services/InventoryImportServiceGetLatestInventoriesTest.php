<?php

namespace Tests\Api\InventoryImport\Services;

use App\Api\InventoryImport\Services\InventoryImportService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InventoryImportServiceGetLatestInventoriesTest extends TestCase
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InventoryImportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getLatestInventories');
    $this->method->setAccessible(true);
  }

  public function testSuccessNoData()
  {
    DB::table('inventories')->delete();

    $actual = $this->method->invoke($this->service,  '2021/01');

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccess1()
  {
    DB::table('inventories')->delete();
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ],
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }

  public function testSuccess2()
  {
    DB::table('inventories')->delete();
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ],
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }

  public function testSuccess3()
  {
    DB::table('inventories')->delete();
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/06',
        'item_number' => '00-0000-0001',
        'quantity' => 3,
      ],
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 23,
      ],
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0001',
        'quantity' => 12,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 23,
      ],
    ];

    $actual = json_decode(json_encode($actual), true);
    $this->assertEquals($expected, $actual);
  }

  public function testSuccess4()
  {
    DB::table('inventories')->delete();
    DB::table('inventories')->insert([
      [
        'import_month' => '2021/06',
        'item_number' => '00-0000-0001',
        'quantity' => 3,
      ],
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 23,
      ],
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0003',
        'quantity' => 8,
      ],
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0001',
        'quantity' => 12,
      ],
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0002',
        'quantity' => 9,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0001',
        'quantity' => 23,
      ],
      [
        'import_month' => '2021/05',
        'item_number' => '00-0000-0003',
        'quantity' => 8,
      ],
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0002',
        'quantity' => 9,
      ],
    ];

    $actual = json_decode(json_encode($actual), true);
    $this->assertEquals($expected, $actual);
  }


}