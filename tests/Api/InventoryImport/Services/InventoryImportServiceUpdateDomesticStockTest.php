<?php

namespace Tests\Api\InventoryImport\Services;

use App\Api\InventoryImport\Services\InventoryImportService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InventoryImportServiceUpdateDomesticStockTest extends TestCase
{
  /** @var \App\Api\InventoryImport\Services\InventoryImportService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InventoryImportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('updateDomesticStock');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        'id' => 1,
        'item_number' => '01-00001-001',
        'domestic_stocks' => 1,
      ],
      [
        'id' => 2,
        'item_number' => '01-00001-002',
        'domestic_stocks' => 2,
      ],
      [
        'id' => 3,
        'item_number' => '01-00001-003',
        'domestic_stocks' => 3,
      ],
    ]);

    DB::table('t_inventories')->delete();
    DB::table('t_inventories')->insert([
      [
        'import_month' => '2021/01',
        'item_number' => '01-00001-001',
        'quantity' => 101,
      ],
      [
        'import_month' => '2021/01',
        'item_number' => '01-00001-002',
        'quantity' => 102,
      ],      
    ]);
    DB::table('t_inventory_moves')->delete();
    DB::table('t_inventory_moves')->insert([
      [
        'job_date' => '2021/02/01',
        'detail_kind' => 1,
        'item_number' => '01-00001-001',
        'quantity' => 5,
      ],
    ]);
  }

  public function testSuccess1()
  {

    $actual = $this->method->invoke($this->service, '2021/01');
  }
}
