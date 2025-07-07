<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoiceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Tests\TestCase;

class InvoiceServiceGetPdfListDataTest extends TestCase
{
  /** @var \App\Api\Invoice\Services\InvoiceService */
  protected $service;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new InvoiceService();
    DB::table('config_currencies')->delete();
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
        'account_name1' => '口座名1',
        'bank_name1' => '銀行名1',
        'branch_name1' => '支店名1',
        'account_type1' => '口座種別1',
        'account_number1' => '1000001',
        'account_name2' => '口座名2',
        'bank_name2' => '銀行名2',
        'branch_name2' => '支店名2',
        'account_type2' => '口座種別2',
        'account_number2' => '2000002',
        'company_level' => 'C',
        'sales_tax_rate' => 10,
        'pre_tax_rate' => 8,
        'tax_rate_change_date' => '2019-10-01',
        'supplier_id' => null,
      ],
    ]);
    DB::table('config_currencies')->insert([
      [
        'id' => 1,
        'name' => '米ドル',
        'rate' => 110.00,
      ],
    ]);

    DB::table('invoice_details')->delete();
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

  // public function testSuccessNoData()
  // {
  //   DB::table('invoices')->delete();

  //   $actual = $this->service->getPdfData([
  //     'c_invoice_month' => '2021/01',
  //     'selected' => [],
  //   ]);

  //   $this->assertEquals([], $actual['data']->toArray());
  // }

  public function testSuccess1()
  {
    DB::table('invoices')->insert([
      [
        'id' => 1,
        'invoice_date' => '2021/06/02',
        'invoice_month' => '2021/06',
        'customer_id' => 1,
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'tel' => '000-0000-0001',
        'total_amount' => 3000,
      ],
      [
        'id' => 2,
        'invoice_date' => '2021/06/02',
        'invoice_month' => '2021/06',
        'customer_id' => 2,
        'zip_code' => '000-0002',
        'address1' => '住所1-02',
        'tel' => '000-0000-0002',
        'total_amount' => 3002,
      ],
    ]);
    DB::table('invoice_details')->insert([
      [
        'id' => 1,
        'invoice_id' => 1,
        'no' => 1,
        'job_date' => '2021/06/01',
        'detail_kind' => 2,
        'item_name' => '商品名01-1',
      ],
      [
        'id' => 2,
        'invoice_id' => 1,
        'no' => 2,
        'job_date' => '2021/06/07',
        'detail_kind' => 1,
        'item_name' => '商品名01-2',
      ],
      [
        'id' => 3,
        'invoice_id' => 2,
        'no' => 1,
        'job_date' => '2021/06/01',
        'detail_kind' => 2,
        'item_name' => '商品名02-1',
      ],
      [
        'id' => 4,
        'invoice_id' => 2,
        'no' => 2,
        'job_date' => '2021/06/06',
        'detail_kind' => 1,
        'item_name' => '商品名02-2',
      ],
    ]);
    $actual = $this->service->getPdfData([
      'c_invoice_month' => '2021/06',
      'selected' => [1],
    ]);

    $data = new Collection($actual);

    $rows = $data->get('data');
    $this->assertEquals(1, count($rows));

    foreach ($rows as $row) {
      $details = $row["details"];
      $this->assertEquals(2, count($details));
    }
  }

  // public function testSuccess2()
  // {
  //   DB::table('invoices')->delete();
  //   DB::table('invoices')->insert([
  //     [
  //       'invoice_date' => '2021/06/02',
  //       'invoice_month' => '2021/06',
  //       'customer_id' => 1,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 300,
  //     ],
  //     [
  //       'invoice_date' => '2021/05/02',
  //       'invoice_month' => '2021/05',
  //       'customer_id' => 1,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 520,
  //     ],
  //     [
  //       'invoice_date' => '2021/04/20',
  //       'invoice_month' => '2021/04',
  //       'customer_id' => 1,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 400,
  //     ],
  //   ]);
  //   $actual = $this->method->invoke($this->service, '2021/06');
  //   $expected =  [
  //     [
  //       'customer_id' => 1,
  //       'total_amount' => 520,
  //     ],
  //   ];

  //   $this->assertEquals($expected, json_decode(json_encode($actual), true));
  // }

  // public function testSuccess3()
  // {
  //   DB::table('invoices')->delete();
  //   DB::table('invoices')->insert([
  //     [
  //       'invoice_date' => '2021/06/02',
  //       'invoice_month' => '2021/06',
  //       'customer_id' => 1,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 300,
  //     ],
  //     [
  //       'invoice_date' => '2021/05/02',
  //       'invoice_month' => '2021/05',
  //       'customer_id' => 2,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 520,
  //     ],
  //     [
  //       'invoice_date' => '2021/04/20',
  //       'invoice_month' => '2021/04',
  //       'customer_id' => 1,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 400,
  //     ],
  //     [
  //       'invoice_date' => '2021/04/20',
  //       'invoice_month' => '2021/04',
  //       'customer_id' => null,
  //       'zip_code' => '000-0001',
  //       'address1' => '住所1-01',
  //       'tel' => '000-0000-0001',
  //       'total_amount' => 480,
  //     ],
  //   ]);
  //   $actual = $this->method->invoke($this->service, '2021/06');
  //   $expected =  [
  //     [
  //       'customer_id' => 2,
  //       'total_amount' => 520,
  //     ],
  //     [
  //       'customer_id' => 1,
  //       'total_amount' => 400,
  //     ],
  //   ];

  //   $actual = json_decode(json_encode($actual), true);
  //   $this->assertEquals($expected, $actual);
  // }

}