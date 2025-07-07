<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReadMailServiceStoreTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('receive_order_details')->delete();
    DB::table('receive_orders')->delete();
    DB::table('receive_orders')->insert([
      [
        "receive_order_date" => Carbon::now()->format('Y/m/d'),
        "customer_id" => 1,
        "customer_name" => "得意先01",
        "send_flg" => 0,
        "name" => "得意先01",
        "zip_code" => "101-0001",
        "address1" => "住所101",
        "address2" => "住所201",
        "tel" => "01-0200-0001",
        "fax" => "02-0200-0001",
        "corporate_class" => 2,
        "shipping_amount" => 10,
        "fee" => 20,
        "discount" => 30,
        "total_amount" => 400,
        "order_no" => "201201R02211",
        "remarks" => "",
        "rate" => 90,
        "fraction" => 2, 
      ],
    ]);
  }

  public function testSuccess()
  {
    $data = [
      "receive_order_date" => Carbon::now()->format('Y/m/d'),
      "customer_id" => 2,
      "customer_name" => "得意先02",
      "send_flg" => 1,
      "name" => "得意先02",
      "zip_code" => "101-0002",
      "address1" => "住所102",
      "address2" => "住所202",
      "tel" => "01-0200-0001",
      "fax" => "02-0200-0001",
      "corporate_class" => 4,
      "shipping_amount" => 0,
      "fee" => 0,
      "discount" => 0,
      "total_amount" => 3200,
      "order_no" => "201201R02211",
      "remarks" => "納期★1 ヶ月半★",
      "rate" => 80,
      "fraction" => 2,
      "details" => [
        [
          'item_kind' => 1,
          'item_id' => 2,
          'item_number' => "01-402-6212-0",
          'item_name' => "ITEM02",
          'item_name_jp' => "商品名02",
          'sales_unit_price' => "2000.00",
          'fraction' => 2,
          'rate' => 80,
          'unit_price' => "1600.00",
          'quantity' => 2,
          'amount' => 3200,
          'sales_tax_rate' => 10,
          'sales_tax' => 291,
        ],
      ],
    ];
    $this->service->store($data);
  }
}