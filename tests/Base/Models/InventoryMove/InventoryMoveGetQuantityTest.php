<?php

namespace Tests\Base\Models\InventoryMove;

use App\Base\Models\InventoryMove;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class InventoryMoveGetQuantityTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('inventory_moves')->delete();
    DB::table('inventory_moves')->insert([
      [
        'id' => 2,
        'job_date' => '2021-01-02 01:11:11',
        'detail_kind' => 1,
        'sales_id' => 1,
        'purchase_id' => null,
        'item_number' => '01-000-0001-0',
        'quantity' => 101,
      ],
      [
        'id' => 3,
        'job_date' => '2021-02-02 01:11:11',
        'detail_kind' => 1,
        'sales_id' => 1,
        'purchase_id' => null,
        'item_number' => '01-000-0001-0',
        'quantity' => 102,
      ],
      [
        'id' => 4,
        'job_date' => '2021-01-03 01:11:11',
        'detail_kind' => 1,
        'sales_id' => 1,
        'purchase_id' => null,
        'item_number' => '01-000-0001-0',
        'quantity' => 103,
      ],
      [
        'id' => 5,
        'job_date' => '2021-01-03 01:11:11',
        'detail_kind' => 1,
        'sales_id' => 1,
        'purchase_id' => null,
        'item_number' => '01-000-0002-0',
        'quantity' => 104,
      ],
      [
        'id' => 6,
        'job_date' => '2021-01-03 01:11:11',
        'detail_kind' => 1,
        'sales_id' => 1,
        'purchase_id' => null,
        'item_number' => '01-000-0006-0',
        'quantity' => 105,
      ],
      [
        'id' => 22,
        'job_date' => '2021-01-02 01:11:11',
        'detail_kind' => 2,
        'sales_id' => null,
        'purchase_id' => 1,
        'item_number' => '01-000-0001-0',
        'quantity' => 21,
      ],
      [
        'id' => 23,
        'job_date' => '2021-02-02 01:11:11',
        'detail_kind' => 2,
        'sales_id' => null,
        'purchase_id' => 1,
        'item_number' => '01-000-0001-0',
        'quantity' => 22,
      ],
      [
        'id' => 24,
        'job_date' => '2021-01-03 01:11:11',
        'detail_kind' => 2,
        'sales_id' => null,
        'purchase_id' => 1,
        'item_number' => '01-000-0001-0',
        'quantity' => 23,
      ],
      [
        'id' => 25,
        'job_date' => '2021-01-03 01:11:11',
        'detail_kind' => 2,
        'sales_id' => null,
        'purchase_id' => 1,
        'item_number' => '01-000-0002-0',
        'quantity' => 24,
      ],
      [
        'id' => 26,
        'job_date' => '2021-01-03 01:11:11',
        'detail_kind' => 2,
        'sales_id' => null,
        'purchase_id' => 1,
        'item_number' => '01-000-0026-0',
        'quantity' => 25,
      ],
    ]);
  }

  public function testSuccess1()
  {

    $actual = InventoryMove::getQuantity("2021/01", "01-000-0001-0");
    $expected = 306 - 66;

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess2()
  {
    $actual = InventoryMove::getQuantity("2021/02", "01-000-0001-0");
    $expected = 102 - 22;

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess3()
  {
    $actual = InventoryMove::getQuantity("2021/01", "01-000-0006-0");
    $expected = 105;

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess4()
  {
    $actual = InventoryMove::getQuantity("2021/01", "01-000-0026-0");
    $expected = -25;

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess5()
  {
    $actual = InventoryMove::getQuantity("2021/04", "01-000-0001-0");
    $expected = 0;

    $this->assertEquals($expected, $actual);
  }

  public function testSuccess6()
  {
    $actual = InventoryMove::getQuantity("", "01-000-0001-0");
    $expected = 306 - 66;

    $this->assertEquals($expected, $actual);
  }

}
