<?php

namespace Tests\Api\Sales\Services;

use App\Api\Sales\Services\SalesService;
use App\Base\Models\SalesDetail;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class SalesServiceInsertInventoryMovesTest extends TestCase
{
  /** @var \App\Api\Sales\Services\SalesService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new SalesService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('insertInventoryMoves');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('sales_details')->delete();
    DB::table('sales')->delete();
    DB::table('sales')->insert([
      [
        'id' => 2,
        'sales_date' => '2021-01-02',
        'tel' => '111-1111-1111',
        'corporate_class' => 2,
        'total_amount' => 1101,
      ],
      [
        'id' => 3,
        'sales_date' => '2021-02-02',
        'tel' => '111-1111-1111',
        'corporate_class' => 2,
        'total_amount' => 1102,
      ],
      [
        'id' => 4,
        'sales_date' => '2021-01-03',
        'tel' => '111-1111-1111',
        'corporate_class' => 2,
        'total_amount' => 1103,
      ],
    ]);
    DB::table('sales_details')->insert([
      [
        'id' => 21,
        'sales_id' => 2,
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
      ],
      [
        'id' => 22,
        'sales_id' => 2,
        'no' => 2,
        'item_kind' => 2,
        'item_id' => 1,
        'item_number' => "01-001-0001-0",
        'item_name' => 'item01',
        'item_name_jp' => 'item_jp01',
        'sales_unit_price' => 501,
        'rate' => 100,
        'fraction' => 1,
        'unit_price' => 1001,
        'quantity' => 202,
        'amount' => 2001,
        'sales_tax_rate' => 10,
        'sales_tax' => 200,
        'parent_id' => null,
      ],
      [
        'id' => 23,
        'sales_id' => 2,
        'no' => 3,
        'item_kind' => 3,
        'item_id' => 1,
        'item_number' => "01-001-0001-0",
        'item_name' => 'item01',
        'item_name_jp' => 'item_jp01',
        'sales_unit_price' => 501,
        'rate' => 100,
        'fraction' => 1,
        'unit_price' => 1001,
        'quantity' => 203,
        'amount' => 2001,
        'sales_tax_rate' => 10,
        'sales_tax' => 200,
        'parent_id' => null,
      ],
    ]);

    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'job_date' => '2021-01-03',
        'detail_kind' => 1,
        'sales_id' => null,
        'purchase_id' => 2,
        'item_number' => '',
        'quantity' => 101,
      ],
      [
        'job_date' => '2021-01-04',
        'detail_kind' => 2,
        'sales_id' => 2,
        'purchase_id' => null,
        'item_number' => '',
        'quantity' => 102,
      ],
      [
        'job_date' => '2021-01-05',
        'detail_kind' => 2,
        'sales_id' => 3,
        'purchase_id' => null,
        'item_number' => '',
        'quantity' => 103,
      ],
    ]);

  }

  public function testSuccess()
  {
    $this->method->invoke($this->service, 2);
  }
}
