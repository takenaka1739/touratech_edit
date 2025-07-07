<?php

namespace Tests\Api\Estimate\Services;

use App\Api\Estimate\Services\EstimatePdfService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EstimatePdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  public function setUp(): void
  {
    parent::setUp();

    config()->set('const.paths.estimate.output_path', 'test/estimate/');
    $this->service = new EstimatePdfService();

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
        'supplier_id' => null,
        'send_trader' => 33000,
        'send_personal' => 11000,
        'send_price' => 800,
      ],
    ]);
    DB::table('config_currencies')->insert([
      [
        'id' => 1,
        'name' => '米ドル',
        'rate' => 110.00,
      ],
    ]);
  }

  public function testSuccess()
  {

    $details = [];
    // for ($i = 0; $i < 18; $i++) {
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
      'item_name_jp' => '123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@',
      'quantity' => 1000,
      'item_kind' => 1,
      'unit_price' => 123456.78,
      'amount' => 222222.22,
      'sales_tax' => 202.33,
    ];

    $file_id = $this->service->createPdf([
      'id' => 102,
      'estimate_date' => '2029/12/23',
      'delivery_date' => '2030/11/24',
      'name' => '届け先名01ああああいいい',
      'address1' => '住所1',
      'address2' => '住所2',
      'corporate_class' => 2,
      'shipping_amount' => 100.23,
      'fee' => 203.50,
      'discount' => 303.10,
      'total_amount' => 123456789.32,
      'details' => $details,
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