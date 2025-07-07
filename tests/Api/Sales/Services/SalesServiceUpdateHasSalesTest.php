<?php

namespace Tests\Api\Sales\Services;

use App\Api\Sales\Services\SalesService;
use App\Base\Models\SalesDetail;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class SalesServiceUpdateHasSalesTest extends TestCase
{
  /** @var \App\Api\Sales\Services\SalesService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new SalesService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('updateHasSales');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    // DB::table('receive_order_has_sales')->delete();
    DB::table('link_r_order_sales_detail')->delete();
    DB::table('sales_details')->delete();
    DB::table('receive_order_details')->delete();
    DB::table('receive_orders')->delete();
  }

  // public function testSuccess()
  // {
  //   $this->method->invoke($this->service, 2);
  // }

  public function testSuccess2()
  {
    DB::table('receive_orders')->insert([
      [
        "id" => 1,
        "receive_order_date" => "2021/08/21",
        "tel" => "0000-000-001",
        "corporate_class" => 1,
        "total_amount" => 101,
      ],
      [
        "id" => 2,
        "receive_order_date" => "2021/08/22",
        "tel" => "0000-000-002",
        "corporate_class" => 2,
        "total_amount" => 102,
      ],
    ]);

    DB::table('receive_order_details')->insert([[
      'id' => 1,
      'receive_order_id' => 1,
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
      'quantity' => 21,
      'amount' => 2001,
      'sales_tax_rate' => 10,
      'sales_tax' => 200,
      'parent_id' => null,
    ]]);

    DB::table('sales_details')->insert([[
      'id' => 1,
      'sales_id' => 1,
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
      'quantity' => 22,
      'amount' => 2001,
      'sales_tax_rate' => 10,
      'sales_tax' => 200,
      'parent_id' => null,
    ]]);

    DB::table("link_r_order_sales_detail")->insert([
      [
        "sales_detail_id" => 1,
        "receive_order_detail_id" => 1,
      ],
    ]);

    $this->method->invoke($this->service, 1);
  }

  // public function testSuccess3()
  // {

  //   DB::table('receive_order_details')->insert([[
  //     'id' => 1,
  //     'receive_order_id' => 1,
  //     'no' => 1,
  //     'item_kind' => 1,
  //     'item_id' => 1,
  //     'item_number' => "01-001-0001-0",
  //     'item_name' => 'item01',
  //     'item_name_jp' => 'item_jp01',
  //     'sales_unit_price' => 501,
  //     'rate' => 100,
  //     'fraction' => 1,
  //     'unit_price' => 1001,
  //     'quantity' => 21,
  //     'amount' => 2001,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 200,
  //     'parent_id' => null,
  //   ],[
  //     'id' => 2,
  //     'receive_order_id' => 1,
  //     'no' => 2,
  //     'item_kind' => 2,
  //     'item_id' => 2,
  //     'item_number' => "01-001-0001-0",
  //     'item_name' => 'item01',
  //     'item_name_jp' => 'item_jp01',
  //     'sales_unit_price' => 501,
  //     'rate' => 100,
  //     'fraction' => 1,
  //     'unit_price' => 1001,
  //     'quantity' => 21,
  //     'amount' => 2001,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 200,
  //     'parent_id' => null,
  //   ],[
  //     'id' => 3,
  //     'receive_order_id' => 1,
  //     'no' => 3,
  //     'item_kind' => 3,
  //     'item_id' => 1,
  //     'item_number' => "01-001-0001-0",
  //     'item_name' => 'item01',
  //     'item_name_jp' => 'item_jp01',
  //     'sales_unit_price' => 501,
  //     'rate' => 101,
  //     'fraction' => 1,
  //     'unit_price' => 1001,
  //     'quantity' => 23,
  //     'amount' => 2001,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 201,
  //     'parent_id' => 2,
  //   ],[
  //     'id' => 4,
  //     'receive_order_id' => 1,
  //     'no' => 4,
  //     'item_kind' => 3,
  //     'item_id' => 2,
  //     'item_number' => "01-001-0002-0",
  //     'item_name' => 'item02',
  //     'item_name_jp' => 'item_jp02',
  //     'sales_unit_price' => 502,
  //     'rate' => 102,
  //     'fraction' => 1,
  //     'unit_price' => 1002,
  //     'quantity' => 24,
  //     'amount' => 2002,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 202,
  //     'parent_id' => 2,
  //   ]]);

  //   DB::table('sales_details')->insert([[
  //     'id' => 1,
  //     'sales_id' => 1,
  //     'no' => 1,
  //     'item_kind' => 1,
  //     'item_id' => 1,
  //     'item_number' => "01-001-0001-0",
  //     'item_name' => 'item01',
  //     'item_name_jp' => 'item_jp01',
  //     'sales_unit_price' => 501,
  //     'rate' => 100,
  //     'fraction' => 1,
  //     'unit_price' => 1001,
  //     'quantity' => 21,
  //     'amount' => 2001,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 200,
  //     'parent_id' => null,
  //   ],[
  //     'id' => 2,
  //     'sales_id' => 1,
  //     'no' => 2,
  //     'item_kind' => 2,
  //     'item_id' => 2,
  //     'item_number' => "01-001-0001-0",
  //     'item_name' => 'item01',
  //     'item_name_jp' => 'item_jp01',
  //     'sales_unit_price' => 501,
  //     'rate' => 100,
  //     'fraction' => 1,
  //     'unit_price' => 1001,
  //     'quantity' => 20,
  //     'amount' => 2001,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 200,
  //     'parent_id' => null,
  //   ],[
  //     'id' => 3,
  //     'sales_id' => 1,
  //     'no' => 3,
  //     'item_kind' => 3,
  //     'item_id' => 1,
  //     'item_number' => "01-001-0001-0",
  //     'item_name' => 'item01',
  //     'item_name_jp' => 'item_jp01',
  //     'sales_unit_price' => 501,
  //     'rate' => 101,
  //     'fraction' => 1,
  //     'unit_price' => 1001,
  //     'quantity' => 23,
  //     'amount' => 2001,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 201,
  //     'parent_id' => 2,
  //   ],[
  //     'id' => 4,
  //     'sales_id' => 1,
  //     'no' => 4,
  //     'item_kind' => 3,
  //     'item_id' => 2,
  //     'item_number' => "01-001-0002-0",
  //     'item_name' => 'item02',
  //     'item_name_jp' => 'item_jp02',
  //     'sales_unit_price' => 502,
  //     'rate' => 102,
  //     'fraction' => 1,
  //     'unit_price' => 1002,
  //     'quantity' => 24,
  //     'amount' => 2002,
  //     'sales_tax_rate' => 10,
  //     'sales_tax' => 202,
  //     'parent_id' => 2,
  //   ]]);

  //   DB::table("link_r_order_sales_detail")->insert([
  //     [
  //       "sales_detail_id" => 2,
  //       "receive_order_detail_id" => 2,
  //     ],
  //   ]);

  //   $this->method->invoke($this->service, 1);
  // }
}
