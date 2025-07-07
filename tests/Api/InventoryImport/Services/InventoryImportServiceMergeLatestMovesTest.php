<?php

namespace Tests\Api\InventoryImport\Services;

use App\Api\InventoryImport\Services\InventoryImportService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InventoryImportServiceMergeLatestMovesTest extends TestCase
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InventoryImportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('mergeLatestMoves');
    $this->method->setAccessible(true);
  }

  public function testSuccess()
  {
    $latest = new Collection([
      [
        'import_month' => '2021/04',
        'item_number' => '00-0000-0001',
        'quantity' => 123,
      ]
    ]);
    $moves = new Collection([
      '00-0000-0002' => [
        'quantity' => -25,
      ],
      '00-0000-0001' => [
        'quantity' => 18,
      ],
    ]);

    $actual = $this->method->invoke($this->service, "2021/01", $latest, $moves);
    $expected = [
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0001',
        'quantity' => 0,
        'stocks' => 141,
        'unmatch' => 1,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '00-0000-0002',
        'quantity' => 0,
        'stocks' => -25,
        'unmatch' => 1,
      ]
    ];

    $this->assertEquals($expected, $actual->toArray());
  }


}