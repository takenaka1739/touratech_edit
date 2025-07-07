<?php

namespace Tests\Api\InventoryImport\Services;

use App\Api\InventoryImport\Services\InventoryImportService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InventoryImportServiceGetInventoryMovesTest extends TestCase
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InventoryImportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getInventoryMoves');
    $this->method->setAccessible(true);
  }

  public function testSuccessNoData()
  {
    DB::table('inventory_moves')->delete();

    $actual = $this->method->invoke($this->service,  '2021/01');

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccess1()
  {
    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 1,
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      '00-0000-0001' => [
        'stocks' => 123,
      ],
    ];

    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess2()
  {
    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 2,
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected = [
      '00-0000-0001' => [
        'stocks' => -123,
      ],
    ];

    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess3()
  {
    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 2,
        'item_number' => '00-0000-0001',
        'quantity' => 25,
      ],
      [
        'job_date' => '2021-06-02',
        'detail_kind' => 1,
        'item_number' => '00-0000-0001',
        'quantity' => 18,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected = [
      '00-0000-0001' => [
        'stocks' => -7,
      ],
    ];

    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess4()
  {
    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 2,
        'item_number' => '00-0000-0002',
        'quantity' => 25,
      ],
      [
        'job_date' => '2021-06-30 12:00:00',
        'detail_kind' => 1,
        'item_number' => '00-0000-0001',
        'quantity' => 18,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected = [
      '00-0000-0002' => [
        'stocks' => -25,
      ],
      '00-0000-0001' => [
        'stocks' => 18,
      ],
    ];

    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess5()
  {
    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-05-31',
        'detail_kind' => 2,
        'item_number' => '00-0000-0001',
        'quantity' => 22,
      ],
      [
        'job_date' => '2021-06-01',
        'detail_kind' => 2,
        'item_number' => '00-0000-0001',
        'quantity' => 25,
      ],
      [
        'job_date' => '2021-07-01',
        'detail_kind' => 1,
        'item_number' => '00-0000-0001',
        'quantity' => 18,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected = [
      '00-0000-0001' => [
        'stocks' => -25,
      ],
    ];

    $this->assertEquals($expected, $actual->toArray());
  }

}