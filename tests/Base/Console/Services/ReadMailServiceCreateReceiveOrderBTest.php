<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReadMailServiceCreateReceiveOrderBTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('configs')->delete();
    DB::table('configs')->insert([[
      'id' => 1,
      'company_name' => '',
      'zip_code' => '',
      'address1' => '',
      'address2' => '',
      'tel' => '',
      'fax' => '',
      'email' => '',
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
      'company_level' => '',
      'sales_tax_rate' => 10,
      'pre_tax_rate' => 8,
      'tax_rate_change_date' => '2019-10-01',
      'send_trader' => 33000,
      'send_personal' => 11000,
      'send_price' => 800,
    ]]);
    DB::table("customers")->truncate();
    DB::table('customers')->insert([
      [
        "id" => 4,
        "name" => "酒部圭司",
        "kana" => "",
        "zip_code" => "101-0001",
        "address1" => "住所101",
        "address2" => "住所201",
        "tel" => "090-1835-7672",
        "fax" => "02-0100-0001",
        "fraction" => 1,
        "corporate_class" => 3,
        "bank_class" => 2,
        "cutoff_date" => 29,
        "rate" => 87,
      ],
    ]);
    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        "id" => 1,
        "item_number" => "01-040-0771-0",
        "name" => "ITEM01",
        "name_jp" => "商品名01",
        "sales_unit_price" => 1000,
        "is_discontinued" => 0,
        "is_display" => 1,
        "is_set_item" => 1,
      ],
      [
        "id" => 2,
        "item_number" => "JP-CT-5610-0",
        "name" => "ITEM02",
        "name_jp" => "商品名02",
        "sales_unit_price" => 2000,
        "is_discontinued" => 1,
        "is_display" => 0,
        "is_set_item" => 0,
      ],
      [
        "id" => 3,
        "item_number" => "JP-CT-5095-0",
        "name" => "ITEM03",
        "name_jp" => "商品名03",
        "sales_unit_price" => 3000,
        "is_discontinued" => 1,
        "is_display" => 0,
        "is_set_item" => 0,
      ],
    ]);
  }

//   public function testSuccess()
//   {
//     $mail = [
//       "from" => "",
//       "subject" => "",
//       "body" => ""
//     ];
//     $result = $this->service->createReceiveOrderB($mail);
//     $expected = null;

//     $this->assertEquals($expected, $result);
//   }

  public function testSuccess2()
  {
    $mail = [
      "body" => "ショッパーカート から伝票番号3933 で下記のとおりご注文がありました。
ご注文番号：3933
発注日：2020 年 12 月 04 日
発注者：佐藤 三郎 様
商品名 型番 詳細 税込単価 注文数 小計
-------------------------------------------------------------------------------------------------------------------------------
アドベンチャーフォールディングミラー（片側１本） M10x1.25 01-040-0771-0 5,093 円 2 10,186 円
CT125 ハンターカブ用ツールボックス JP-CT-5610-0 24,800 円 1 24,800 円
CT125 ヘッドライトプロテクタークイックリリース付きステンレスブラック JP-CT-5095-0 14,300 円 1 14,300 円
-------------------------------------------------------------------------------------------------------------------------------
お買い上げ金額(税込) 49,286 円
送料(税込) 800円
合計 50,086 円
お支払方法：クレジットカード
【ご購入者情報】
ご購入者氏名：佐藤 太郎 様
ご購入者氏名かな：さとう たろう 様
ご購入者郵便番号：901-9898
ご購入者都道府県：京都府
ご購入者郡・市町村・区・町名：京都市伏見区
ご購入者建物名・番地など：201-4-99999
ご購入者電話番号：090-0000-0001
ご購入者メールアドレス：test10101@example.com
【お届け先情報】
お届け先氏名：佐藤 次郎 様
お届け先郵便番号：901-9899
お届け先都道府県：大阪府
お届け先郡・市町村・区・町名：大阪市
お届け先建物名・番地など：4-4
お届け先電話番号：090-0000-0002
配送希望時間帯：指定なし

以上"
    ];
    $result = $this->service->createReceiveOrderB($mail);
    $expected = [
      "receive_order_date" => "2020/12/04",
      "customer_id" => 5,
      "customer_name" => "佐藤 次郎",
      "send_flg" => 1,
      "name" => "佐藤 次郎",
      "zip_code" => "901-9899",
      "address1" => "大阪府大阪市",
      "address2" => "4-4",
      "tel" => "090-0000-0002",
      "fax" => null,
      "corporate_class" => 5,
      "shipping_amount" => 800,
      "fee" => 0,
      "discount" => 0,
      "total_amount" => 50086,
      "order_no" => "3933",
      "remarks" => "",
      "rate" => 100,
      "fraction" => 3,
      "details" => [
        [
          'item_kind' => 2,
          'item_id' => 1,
          'item_number' => "01-040-0771-0",
          'item_name' => "ITEM01",
          'item_name_jp' => "商品名01",
          'sales_unit_price' => "1000.00",
          'fraction' => 3,
          'rate' => 100,
          'unit_price' => 5093,
          'quantity' => 2,
          'amount' => 10186,
          'sales_tax_rate' => 10,
          'sales_tax' => 926,
        ],
        [
          'item_kind' => 1,
          'item_id' => 2,
          'item_number' => "JP-CT-5610-0",
          'item_name' => "ITEM02",
          'item_name_jp' => "商品名02",
          'sales_unit_price' => "2000.00",
          'fraction' => 3,
          'rate' => 100,
          'unit_price' => 24800,
          'quantity' => 1,
          'amount' => 24800,
          'sales_tax_rate' => 10,
          'sales_tax' => 2255,
        ],
        [
          'item_kind' => 1,
          'item_id' => 3,
          'item_number' => "JP-CT-5095-0",
          'item_name' => "ITEM03",
          'item_name_jp' => "商品名03",
          'sales_unit_price' => "3000.00",
          'fraction' => 3,
          'rate' => 100,
          'unit_price' => 14300,
          'quantity' => 1,
          'amount' => 14300,
          'sales_tax_rate' => 10,
          'sales_tax' => 1300,
        ],
      ],
    ];

    $this->assertEquals($expected, $result);
  }
}