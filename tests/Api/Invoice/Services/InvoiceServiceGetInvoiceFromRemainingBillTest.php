<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoiceService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class InvoiceServiceGetInvoiceFromRemainingBillTest extends TestCase
{
  /** @var \App\Api\Invoice\Services\InvoiceService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InvoiceService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getInvoiceFromRemainingBill');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

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
        'corporate_class' => 2,
        'bank_class' => 2,
        'cutoff_date' => 25,
        'rate' => 80,
      ],
      [
        'id' => 3,
        'name' => '得意先03',
        'kana' => 'トクイサキ03',
        'zip_code' => '000-0003',
        'address1' => '住所1-03',
        'tel' => '000-0000-0003',
        'corporate_class' => 2,
        'bank_class' => 10,
        'cutoff_date' => 10,
        'rate' => 100,
      ],
      [
        'id' => 4,
        'name' => '得意先04',
        'kana' => 'トクイサキ04',
        'zip_code' => '000-0004',
        'address1' => '住所1-04',
        'tel' => '000-0000-0004',
        'corporate_class' => 2,
        'bank_class' => 5,
        'cutoff_date' => 5,
        'rate' => 100,
      ],
    ]);


  }

  public function testNoData()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2023/05/02',
        'invoice_month' => '2023/05',
        'customer_id' => 1,
        'customer_name' => 'テスト得意先',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'pre_amount' => 1001,
        'total_receipt' => 2001,
        'carried_forward' => 3001,
        'total_amount' => 4001,
        'total_tax' => 501,
        'total_invoice' => 6001,
      ],
    ]);

    $actual = $this->method->invoke($this->service, '2023/05');
    $expected = [];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }

  public function testSuccess1()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2023/05/02',
        'invoice_month' => '2023/05',
        'customer_id' => 1,
        'customer_name' => 'テスト得意先',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'pre_amount' => 1001,
        'total_receipt' => 2001,
        'carried_forward' => 3001,
        'total_amount' => 4001,
        'total_tax' => 501,
        'total_invoice' => 6001,
      ],
    ]);

    $actual = $this->method->invoke($this->service, '2023/06');
    $expected = [
      [
        'customer_id' => 1,
        'total_invoice' => 6001,
      ]
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }

  public function testSuccess2()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2023/05/02',
        'invoice_month' => '2023/05',
        'customer_id' => 1,
        'customer_name' => 'テスト得意先',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'pre_amount' => 1001,
        'total_receipt' => 2001,
        'carried_forward' => 3001,
        'total_amount' => 4001,
        'total_tax' => 501,
        'total_invoice' => 6001,
      ],
      [
        'invoice_date' => '2023/06/02',
        'invoice_month' => '2023/06',
        'customer_id' => 1,
        'customer_name' => 'テスト得意先',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'pre_amount' => 1002,
        'total_receipt' => 2002,
        'carried_forward' => 3002,
        'total_amount' => 4002,
        'total_tax' => 502,
        'total_invoice' => 6002,
      ],
    ]);

    $actual = $this->method->invoke($this->service, '2023/06');
    $expected = [
      [
        'customer_id' => 1,
        'total_invoice' => 6001,
      ]
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }
  
  public function testSuccess4()
  {
    DB::table('invoices')->delete();
    DB::table('invoices')->insert([
      [
        'invoice_date' => '2023/05/02',
        'invoice_month' => '2023/05',
        'customer_id' => 1,
        'customer_name' => 'テスト得意先',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'pre_amount' => 1001,
        'total_receipt' => 2001,
        'carried_forward' => 3001,
        'total_amount' => 4001,
        'total_tax' => 501,
        'total_invoice' => 6001,
      ],
      [
        'invoice_date' => '2023/06/02',
        'invoice_month' => '2023/06',
        'customer_id' => 1,
        'customer_name' => 'テスト得意先',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'pre_amount' => 1002,
        'total_receipt' => 2002,
        'carried_forward' => 3002,
        'total_amount' => 4002,
        'total_tax' => 502,
        'total_invoice' => 6002,
      ],
      [
        'invoice_date' => '2023/05/04',
        'invoice_month' => '2023/05',
        'customer_id' => 2,
        'customer_name' => 'テスト得意先2',
        'zip_code' => '000-0002',
        'address1' => '住所1-02',
        'tel' => '000-0000-0002',
        'pre_amount' => 1003,
        'total_receipt' => 2003,
        'carried_forward' => 3003,
        'total_amount' => 4003,
        'total_tax' => 503,
        // 'total_invoice' => 6003,
        'total_invoice' => 0,
      ],
      [
        'invoice_date' => '2023/06/04',
        'invoice_month' => '2023/06',
        'customer_id' => 3,
        'customer_name' => 'テスト得意先3',
        'zip_code' => '000-0003',
        'address1' => '住所1-03',
        'tel' => '000-0000-0003',
        'pre_amount' => 1004,
        'total_receipt' => 2004,
        'carried_forward' => 3004,
        'total_amount' => 4004,
        'total_tax' => 504,
        'total_invoice' => 6004,
      ],
      [
        'invoice_date' => '2023/03/04',
        'invoice_month' => '2023/03',
        'customer_id' => 4,
        'customer_name' => 'テスト得意先4',
        'zip_code' => '000-0004',
        'address1' => '住所1-04',
        'tel' => '000-0000-0004',
        'pre_amount' => 1005,
        'total_receipt' => 2005,
        'carried_forward' => 3005,
        'total_amount' => 4005,
        'total_tax' => 505,
        'total_invoice' => 6005,
      ],
    ]);

    $actual = $this->method->invoke($this->service, '2023/06');
    $expected = [
      [
        'customer_id' => 1,
        'total_invoice' => 6001,
      ],
      // [
      //   'customer_id' => 2,
      //   'total_invoice' => 6003,
      // ],
      [
        'customer_id' => 4,
        'total_invoice' => 6005,
      ],
    ];

    $this->assertEquals($expected, json_decode(json_encode($actual), true));
  }
}