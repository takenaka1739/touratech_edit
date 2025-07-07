<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoiceService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InvoiceServiceGetBillingRangeTest extends TestCase
{
  /** @var \App\Api\Invoice\Services\InvoiceService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InvoiceService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getBillingRange');
    $this->method->setAccessible(true);

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
        'deleted_at' => null,
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
        'cutoff_date' => 30,
        'rate' => 80,
        'deleted_at' => null,
      ],
      [
        'id' => 3,
        'name' => '得意先03',
        'kana' => 'トクイサキ03',
        'zip_code' => '000-0003',
        'address1' => '住所1-03',
        'tel' => '000-0000-0003',
        'corporate_class' => 1,
        'bank_class' => 2,
        'cutoff_date' => 30,
        'rate' => 80,
        'deleted_at' => '2021/08/01',
      ],
      [
        'id' => 4,
        'name' => '得意先04',
        'kana' => 'トクイサキ04',
        'zip_code' => '000-0004',
        'address1' => '住所1-04',
        'tel' => '000-0000-0004',
        'corporate_class' => 1,
        'bank_class' => 2,
        'cutoff_date' => 31,
        'rate' => 80,
        'deleted_at' => null,
      ],
      [
        'id' => 5,
        'name' => '得意先05',
        'kana' => 'トクイサキ05',
        'zip_code' => '000-0005',
        'address1' => '住所1-05',
        'tel' => '000-0000-0005',
        'corporate_class' => 1,
        'bank_class' => 2,
        'cutoff_date' => 25,
        'rate' => 80,
        'deleted_at' => null,
      ],
    ]);

  }

  public function testSuccessNoData()
  {
    DB::table('customers')->delete();

    $actual = $this->method->invoke($this->service, '2021/01', null);

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccessNoData2()
  {
    DB::table('customers')->delete();

    $actual = $this->method->invoke($this->service, '2021/01');

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccessNoData3()
  {
    DB::table('customers')->delete();

    $actual = $this->method->invoke($this->service, '2021/01', 31);

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccessAll()
  {
    $actual = $this->method->invoke($this->service, '2021/01', null);
    $expected = [
      [
        'customer_id' => 1,
        'date_from' => '2021/01/01',
        'date_to' => '2021/01/31',
      ],
      [
        'customer_id' => 2,
        'date_from' => '2020/12/31',
        'date_to' => '2021/01/30',
      ],
      [
        'customer_id' => 4,
        'date_from' => '2021/01/01',
        'date_to' => '2021/01/31',
      ],
      [
        'customer_id' => 5,
        'date_from' => '2020/12/26',
        'date_to' => '2021/01/25',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess1_1()
  {
    $actual = $this->method->invoke($this->service, '2021/01', 30);
    $expected = [
      [
        'customer_id' => 2,
        'date_from' => '2020/12/31',
        'date_to' => '2021/01/30',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess1_2()
  {
    $actual = $this->method->invoke($this->service, '2021/01', 31);
    $expected = [
      [
        'customer_id' => 1,
        'date_from' => '2021/01/01',
        'date_to' => '2021/01/31',
      ],
      [
        'customer_id' => 4,
        'date_from' => '2021/01/01',
        'date_to' => '2021/01/31',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess1_3()
  {
    $actual = $this->method->invoke($this->service, '2021/01', 25);
    $expected = [
      [
        'customer_id' => 5,
        'date_from' => '2020/12/26',
        'date_to' => '2021/01/25',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess2_1()
  {
    $actual = $this->method->invoke($this->service, '2021/02', 30);
    $expected = [
      [
        'customer_id' => 2,
        'date_from' => '2021/01/31',
        'date_to' => '2021/02/28',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess2_2()
  {
    $actual = $this->method->invoke($this->service, '2021/02', 31);
    $expected = [
      [
        'customer_id' => 1,
        'date_from' => '2021/02/01',
        'date_to' => '2021/02/28',
      ],
      [
        'customer_id' => 4,
        'date_from' => '2021/02/01',
        'date_to' => '2021/02/28',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess2_3()
  {
    $actual = $this->method->invoke($this->service, '2021/02', 25);
    $expected = [
      [
        'customer_id' => 5,
        'date_from' => '2021/01/26',
        'date_to' => '2021/02/25',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess3_1()
  {
    $actual = $this->method->invoke($this->service, '2021/03', 30);
    $expected = [
      [
        'customer_id' => 2,
        'date_from' => '2021/03/01',
        'date_to' => '2021/03/30',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess3_2()
  {
    $actual = $this->method->invoke($this->service, '2021/03', 31);
    $expected = [
      [
        'customer_id' => 1,
        'date_from' => '2021/03/01',
        'date_to' => '2021/03/31',
      ],
      [
        'customer_id' => 4,
        'date_from' => '2021/03/01',
        'date_to' => '2021/03/31',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

  public function testSuccess3_3()
  {
    $actual = $this->method->invoke($this->service, '2021/03', 25);
    $expected = [
      [
        'customer_id' => 5,
        'date_from' => '2021/02/26',
        'date_to' => '2021/03/25',
      ],
    ];
    $this->assertEquals($expected, $actual->toArray());
  }

}