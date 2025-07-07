<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoicePdfService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InvoicePdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  protected $config_data;

  public function setUp(): void
  {
    parent::setUp();

    config()->set('const.paths.invoice.output_path', 'test/invoice/pdf/');
    $this->service = new InvoicePdfService();

    $this->config_data = [
      'company_name' => 'ツアラテックジャパン（テスト）',
      'zip_code' => '123-4567',
      'address1' => '住所１－＋－－－－１－－－－＋－－－－２',
      'address2' => '住所２－＋－－－－１－－－－＋－－－－２',
      'tel' => '111-111-1111',
      'fax' => '222-222-2222',
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
    ];
  }

  public function testSuccess()
  {
    $data = [];
    for ($i = 0; $i < 1; $i++) {
      $details = [];
      // for ($j = 0; $j < 2; $j++) {
      //   $details[] = [
      //     'invoicd_id' => $i + 1,
      //     'no' => $j + 1,
      //     'job_date' => '2020/12/03',
      //     'detail_kind' => ($j % 2) + 1,
      //     'item_kind' => 2,
      //     'item_id' => 99,
      //     'item_name' => '商品名01',
      //     'unit_price' => 10001,
      //     'quantity' => 200,
      //     'amount' => 30001,
      //     'sales_tax_rate' => 10,
      //     'sales_tax' => 4001,
      //   ];
      // }
      $details[] = [
        'invoicd_id' => $i + 1,
        'no' => 1,
        'job_date' => '2020/12/03',
        'detail_kind' => 1,
        'item_kind' => 2,
        'item_id' => 99,
        'item_name' => '１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠',
        'unit_price' => 10001,
        'quantity' => 200,
        'amount' => 30001,
        'sales_tax_rate' => 10,
        'sales_tax' => 4001,
      ];
      $details[] = [
        'invoicd_id' => $i + 1,
        'no' => 2,
        'job_date' => '2020/12/03',
        'detail_kind' => 1,
        'item_kind' => 2,
        'item_id' => 99,
        'item_name' => '123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@',
        'unit_price' => 10001,
        'quantity' => 200,
        'amount' => 30001,
        'sales_tax_rate' => 10,
        'sales_tax' => 4001,
      ];

      $data[] = [
        'id' => $i + 100,
        'invoice_date' => '2021/01/02',
        'invoice_month' => '2021/01',
        'customer_id' => 21,
        'customer_name' => '得意先'.($i + 1),
        'zip_code' => '111-1111',
        'address1' => '住所1',
        'address2' => '住所2',
        'tel' => '111-1111-1111',
        'fax' => '222-2222-2222',
        'user_id' => 31,
        'pre_amount' => 10000.00 + $i,
        'total_receipt' => 20000.00 + $i,
        'carried_forward' => 30000.00 + $i,
        'total_amount' => 40000.00 + $i,
        'total_tax' => 50000.00 + $i,
        'total_invoice' => 60000.00 + $i,
        'details' => $details,
        'config_data' => $this->config_data,
        'customer_data' => [
          'bank_class' => 2,
        ]
      ];
    }

    $file_id = $this->service->createPdf([
      'invoice_month' => "2021/01",
      'data' => $data,
    ]);
    $path = app_storage_path($this->service->getStoragePath($file_id));
    rename($path, $this->getNewPath());
  }

  private function getNewPath(string $file_name = 'test.pdf')
  {
    $path = $this->service->getBasePath();
    Storage::makeDirectory($path);
    return app_storage_path($path . $file_name);
  }
}