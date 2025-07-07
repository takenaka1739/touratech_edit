<?php

namespace Tests\Api\Sales\Services;

use App\Api\Sales\Services\SalesPdfService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SalesPdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  protected $config_data;

  public function setUp(): void
  {
    parent::setUp();

    config()->set('const.paths.sales.output_path', 'test/sales/');
    $this->service = new SalesPdfService();

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

    $details = [];
    // for ($i = 0; $i < 1; $i++) {
    //   $details[] = [
    //     'item_number' => '01-051-0000-0',
    //     'item_name_jp' => 'ﾊﾟﾆｱﾙｰﾌﾟ単品(ﾗﾋﾟｯﾄﾞﾄﾗｯﾌﾟ' . ($i + 1),
    //     'quantity' => 1000 + $i,
    //     'item_kind' => 1,
    //     'unit_price' => 123456.78,
    //     'amount' => 222222.22,
    //     'sales_tax' => 202.33,
    //   ];
    // }
    $details[] = [
      'item_number' => '01-051-0000-0',
      'item_name_jp' => '１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠',
      'quantity' => 1000,
      'item_kind' => 1,
      'unit_price' => 123456.78,
      'amount' => 222222.22,
      'sales_tax' => 202.33,
    ];
    $details[] = [
      'item_number' => '01-051-0000-0',
      'item_name_jp' => '123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@
      ',
      'quantity' => 1000,
      'item_kind' => 1,
      'unit_price' => 123456.78,
      'amount' => 222222.22,
      'sales_tax' => 202.33,
    ];

    $file_id = $this->service->createPdf([
      'id' => 102,
      'sales_date' => '2029/12/23',
      'delivery_date' => '2030/11/24',
      'name' => '届け先名01ああああいいい',
      'zip_code' => '111-2222',
      'tel' => '100-1000-0001',
      'fax' => '200-2000-0002',
      'corporate_class' => 2,
      'shipping_amount' => 100.23,
      'fee' => 203.50,
      'total_amount' => 123456789.32,
      'order_no' => '1001A',
      'rate' => 100,
      'sales_tax_rate' => 10,
      'fraction' => 3,
      'user_name' => '山田',
      'details' => $details,
      'config_data' => $this->config_data,
      'customer_data' => [
        'bank_class' => 2,
      ],
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