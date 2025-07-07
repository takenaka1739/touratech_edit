<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoiceService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InvoiceServiceGetSalesTest extends TestCase
{
  /** @var \App\Api\Invoice\Services\InvoiceService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InvoiceService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getSales');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('sales_details')->delete();
    DB::table('sales')->delete();

    DB::table('customers')->delete();
    DB::table('customers')->insert([
      [
        'id' => 1,
        'name' => '得意先01',
        'kana' => 'トクイサキ01',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'corporate_class' => 2,
        'bank_class' => 1,
        'cutoff_date' => 31,
        'rate' => 100,
      ],
      [
        'id' => 2,
        'name' => '得意先02',
        'kana' => 'トクイサキ02',
        'zip_code' => '000-0002',
        'address1' => '住所1-02',
        'tel' => '000-0000-0002',
        'corporate_class' => 1,
        'bank_class' => 2,
        'cutoff_date' => 25,
        'rate' => 80,
      ],
    ]);
  }

  public function testSuccessNoData()
  {
    $actual = $this->method->invoke($this->service, '2021/01', null);

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccessNoData2()
  {
    DB::table('sales')->insert([
      [
        'id' => 1,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ]
    ]);
    DB::table('sales_details')->insert([
      [
        'sales_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/02', null);
    $expected =  [];

    $this->assertEquals(count($expected), $actual->count());
  }

  public function testSuccessNoData3()
  {
    DB::table('sales')->insert([
      [
        'id' => 1,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 3,
        'total_amount' => 100,
      ]
    ]);
    DB::table('sales_details')->insert([
      [
        'sales_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/01', null);
    $expected =  [];

    $this->assertEquals(count($expected), $actual->count());
  }

  public function testSuccess1()
  {
    DB::table('sales')->insert([
      [
        'id' => 1,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ]
    ]);
    DB::table('sales_details')->insert([
      [
        'sales_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/01', null);
    $expected =  [
      [
        'id' => 1,
      ],
    ];

    $this->assertEquals(count($expected), $actual->count());
    // $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess2()
  {
    DB::table('sales')->insert([
      [
        'id' => 1,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ],
      [
        'id' => 2,
        'sales_date' => "2021/02/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ],
    ]);
    DB::table('sales_details')->insert([
      [
        'sales_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ],
      [
        'sales_id' => 2,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/01', null);
    $expected =  [
      [
        'id' => 1,
      ],
    ];

    $this->assertEquals(count($expected), $actual->count());
    for ($i = 0; $i < $actual->count(); $i++) {
      $e = $expected[$i];
      $a = $actual[$i];

      $this->assertEquals($e['id'], $a['id']);
    }
  }

  public function testSuccess3_1()
  {
    DB::table('sales')->insert([
      [
        'id' => 1,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ],
      [
        'id' => 2,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ],
    ]);
    DB::table('sales_details')->insert([
      [
        'sales_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ],
      [
        'sales_id' => 2,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/01', null);
    $expected =  [
      [
        'id' => 1,
      ],
      [
        'id' => 2,
      ],
    ];

    $this->assertEquals(count($expected), $actual->count());
    for ($i = 0; $i < $actual->count(); $i++) {
      $e = $expected[$i];
      $a = $actual[$i];

      $this->assertEquals($e['id'], $a['id']);
    }
  }

  public function testSuccess3_2()
  {
    DB::table('sales')->insert([
      [
        'id' => 1,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 1,
        'total_amount' => 100,
      ],
      [
        'id' => 2,
        'sales_date' => "2021/01/01",
        'customer_id' => 1,
        'tel' => '',
        'corporate_class' => 2,
        'total_amount' => 100,
      ],
    ]);
    DB::table('sales_details')->insert([
      [
        'sales_id' => 1,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ],
      [
        'sales_id' => 2,
        'no' => 1,
        'item_kind' => 1,
        'item_id' => 1,
        'unit_price' => 10,
        'quantity' => 2,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/01', null);
    $expected =  [
      [
        'id' => 2,
      ],
    ];

    $this->assertEquals(count($expected), $actual->count());
    for ($i = 0; $i < $actual->count(); $i++) {
      $e = $expected[$i];
      $a = $actual[$i];

      $this->assertEquals($e['id'], $a['id']);
    }
  }
}