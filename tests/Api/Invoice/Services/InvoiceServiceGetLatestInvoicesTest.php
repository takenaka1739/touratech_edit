<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoiceService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InvoiceServiceGetLatestInvoicesTest extends TestCase
{
  /** @var \App\Api\Invoice\Services\InvoiceService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InvoiceService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getLatestInvoices');
    $this->method->setAccessible(true);

    DB::table('invoices')->delete();
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
    DB::table('invoices')->delete();

    $actual = $this->method->invoke($this->service,  '2021/01');

    $this->assertEquals([], $actual->toArray());
  }

  public function testSuccess1()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2021/05/02',
        'invoice_month' => '2021/05',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 3000,
      ]
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'customer_id' => 1,
        'total_amount' => 3000,
      ],
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }

  public function testSuccess2()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2021/06/02',
        'invoice_month' => '2021/06',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 300,
      ],
      [
        'invoice_date' => '2021/05/02',
        'invoice_month' => '2021/05',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 520,
      ],
      [
        'invoice_date' => '2021/04/20',
        'invoice_month' => '2021/04',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 400,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'customer_id' => 1,
        'total_amount' => 520,
      ],
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }

  public function testSuccess3()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2021/06/02',
        'invoice_month' => '2021/06',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 300,
      ],
      [
        'invoice_date' => '2021/05/02',
        'invoice_month' => '2021/05',
        'customer_id' => 2,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 520,
      ],
      [
        'invoice_date' => '2021/04/20',
        'invoice_month' => '2021/04',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 400,
      ],
      [
        'invoice_date' => '2021/04/20',
        'invoice_month' => '2021/04',
        'customer_id' => null,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 480,
      ],
    ]);
    $actual = $this->method->invoke($this->service, '2021/06');
    $expected =  [
      [
        'customer_id' => 2,
        'total_amount' => 520,
      ],
      [
        'customer_id' => 1,
        'total_amount' => 400,
      ],
    ];

    $actual = json_decode(json_encode($actual), true);
    $this->assertEquals($expected, $actual);
  }

}