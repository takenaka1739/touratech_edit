<?php

namespace Tests\Api\PlaceOrderExport\Services;

use App\Api\PlaceOrderExport\Services\PlaceOrderExportService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class PlaceOrderExportServiceUpdateFileNameTest extends TestCase
{
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new PlaceOrderExportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('updateFileName');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('suppliers')->delete();
    DB::table('suppliers')->insert([
      [
        'id' => 101,
        'name' => '仕入先01',
        'zip_code' => '000-0001',
        'address1' => '住所01',
        'tel' => '000-000-0001',
        'foreign_currency_type' => 1,
      ],
      [
        'id' => 102,
        'name' => '仕入先02',
        'zip_code' => '000-0002',
        'address1' => '住所02',
        'tel' => '000-000-0002',
        'foreign_currency_type' => 2,
      ],
      [
        'id' => 103,
        'name' => '仕入先03',
        'zip_code' => '000-0003',
        'address1' => '住所03',
        'tel' => '000-000-0003',
        'foreign_currency_type' => 3,
      ],
    ]);

    DB::table('configs')->delete();
    DB::table('configs')->insert([
      [
        'id' => 1,
        'company_name' => 'ツアラテックジャパン（テスト）',
        'zip_code' => '123-4567',
        'address1' => '住所１－＋－－－－１－－－－＋－－－－２',
        'address2' => '住所２－＋－－－－１－－－－＋－－－－２',
        'tel' => '111-111-1111',
        'fax' => '222-222-2222',
        'email' => 'test@example.com',
        'account_name1' => '',
        'bank_name1' => '',
        'branch_name1' => '',
        'account_type1' => '',
        'account_number1' => '',
        'account_name2' => '',
        'bank_name2' => '',
        'branch_name2' => '',
        'account_type2' => '',
        'account_number2' => '',
        'company_level' => 'C',
        'sales_tax_rate' => 10,
        'pre_tax_rate' => 8,
        'tax_rate_change_date' => '2019-10-01',
        'supplier_id' => 102,
        'send_trader' => 33000,
        'send_personal' => 11000,
        'send_price' => 800,
      ],
    ]);

    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        'id' => 1,
        'item_number' => '01-00001-001',
        'supplier_id' => 101,
      ],
      [
        'id' => 2,
        'item_number' => '01-00001-002',
        'supplier_id' => 102,
      ],
      [
        'id' => 3,
        'item_number' => '01-00001-003',
        'supplier_id' => 103,
      ],
      [
        'id' => 4,
        'item_number' => '01-00001-004',
        'supplier_id' => 101,
      ],
      [
        'id' => 5,
        'item_number' => '01-00001-005',
        'supplier_id' => 102,
      ],
      [
        'id' => 6,
        'item_number' => '01-00001-006',
        'supplier_id' => 103,
      ],
    ]);

    DB::table('place_order_details')->delete();
    DB::table('place_orders')->delete();
    DB::table('place_orders')->insert([
      [
        "id" => 2,
        "place_order_date" => "2021/08/22",
        'order_file_name' => null,
      ],
      [
        "id" => 3,
        "place_order_date" => "2021/08/23",
        'order_file_name' => null,
      ],
      [
        "id" => 4,
        "place_order_date" => "2021/08/24",
        'order_file_name' => null,
      ],
      [
        "id" => 5,
        "place_order_date" => "2021/08/24",
        'order_file_name' => null,
      ],
      [
        "id" => 6,
        "place_order_date" => "2021/08/24",
        'order_file_name' => 'file_name_6',
      ],
      [
        "id" => 7,
        "place_order_date" => "2021/08/25",
        'order_file_name' => null,
      ],
      [
        "id" => 8,
        "place_order_date" => "2021/08/25",
        'order_file_name' => 'file_name_8',
      ],
    ]);

    DB::table('place_order_details')->insert([
      [
        'id' => 21,
        'place_order_id' => 2,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 31,
        'place_order_id' => 3,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 41,
        'place_order_id' => 4,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 51,
        'place_order_id' => 5,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 52,
        'place_order_id' => 5,
        'no' => 2,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 61,
        'place_order_id' => 6,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 71,
        'place_order_id' => 7,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
      [
        'id' => 81,
        'place_order_id' => 8,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 2,
        'unit_price' => 1001,
        'quantity' => 11,
        'amount' => 11011,
      ],
    ]);
  }

  public function testSuccess()
  {
    $cond = new Collection([
      'c_place_order_date_from' => '2021/08/23',
      'c_place_order_date_to' => '2021/08/24',
      'c_is_output' => false,
    ]);
    $supplierId = 102;
    $fileName = 'test_file_name';
    $this->method->invoke($this->service, $cond, $supplierId, $fileName);

    $actual = DB::table('place_orders')->count('order_file_name');

    $this->assertEquals(4, $actual);
  }
}
