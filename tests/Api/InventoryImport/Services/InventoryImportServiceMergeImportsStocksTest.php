<?php

namespace Tests\Api\InventoryImport\Services;

use App\Api\InventoryImport\Services\InventoryImportService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InventoryImportServiceMergeImportsStocksTest extends TestCase
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InventoryImportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('mergeImportsStocks');
    $this->method->setAccessible(true);
  }

  // public function testNotFound()
  // {
  //   $imports = [];
  //   $stocks = new Collection([]);
  //   $actual = $this->method->invoke($this->service, '2021/01', $imports, $stocks);

  //   $this->assertEquals([], $actual);
  // }

  public function testSuccess1()
  {
    $imports = [
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0002',
        'quantity' => 29,
        'stocks' => 0,
        'unmatch' => 1,
      ],
    ];
    $stocks = new Collection([
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 0,
        'stocks' => 10,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0003',
        'quantity' => 0,
        'stocks' => -60,
        'unmatch' => 1,
      ],
    ]);

    $actual = $this->method->invoke($this->service, '2021/01', $imports, $stocks);

    $expected = [
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0002',
        'quantity' => 29,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0003',
        'quantity' => 0,
        'stocks' => -60,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
        'stocks' => 10,
        'unmatch' => 1,
      ],
    ];

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess2()
  {
    $imports = [
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0002',
        'quantity' => 29,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0005',
        'quantity' => 5,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0006',
        'quantity' => 6,
        'stocks' => 0,
        'unmatch' => 1,
      ],
    ];
    $stocks = new Collection([
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 0,
        'stocks' => 10,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0003',
        'quantity' => 0,
        'stocks' => -60,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0005',
        'quantity' => 0,
        'stocks' => 5,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0007',
        'quantity' => 0,
        'stocks' => 7,
        'unmatch' => 1,
      ],
    ]);

    $actual = $this->method->invoke($this->service, '2021/01', $imports, $stocks);

    $expected = [
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0002',
        'quantity' => 29,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0006',
        'quantity' => 6,
        'stocks' => 0,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0003',
        'quantity' => 0,
        'stocks' => -60,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0007',
        'quantity' => 0,
        'stocks' => 7,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
        'stocks' => 10,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0005',
        'quantity' => 5,
        'stocks' => 5,
        'unmatch' => 0,
      ],
    ];

    $this->assertEquals($expected, $actual);
  }

}