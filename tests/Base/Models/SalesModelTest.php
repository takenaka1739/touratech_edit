<?php

namespace Tests\Base\Models;

use Tests\TestCase;
use App\Base\Models\Sales;
use Illuminate\Support\Facades\DB;

class SalesModelTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();

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
        'item_number' => "01-001-0002-0",
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
        'item_number' => "01-001-0003-0",
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
      [
        'id' => 24,
        'sales_id' => 3,
        'no' => 3,
        'item_kind' => 3,
        'item_id' => 1,
        'item_number' => "01-001-0003-0",
        'item_name' => 'item01',
        'item_name_jp' => 'item_jp01',
        'sales_unit_price' => 501,
        'rate' => 100,
        'fraction' => 1,
        'unit_price' => 1001,
        'quantity' => 204,
        'amount' => 2001,
        'sales_tax_rate' => 10,
        'sales_tax' => 200,
        'parent_id' => null,
      ],
    ]);
  }

  public function testGetItemNumbersSuccess()
  {
    $m = Sales::find(2);
    $actual = $m->getItemNumbers();
    $expected = ["01-001-0001-0", "01-001-0003-0"];

    $this->assertEquals($expected, $actual);
  }
}