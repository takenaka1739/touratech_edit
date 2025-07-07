<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReadMailServiceCreateReceiveOrderATest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

    config()->set('const.mail.customer_id.rivercrane', 2);
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
    DB::table("customers")->delete();
    DB::table('customers')->insert([
      [
        "id" => 1,
        "name" => "得意先01",
        "kana" => "",
        "zip_code" => "101-0001",
        "address1" => "住所101",
        "address2" => "住所201",
        "tel" => "01-0100-0001",
        "fax" => "02-0100-0001",
        "fraction" => 1,
        "corporate_class" => 3,
        "bank_class" => 2,
        "cutoff_date" => 29,
        "rate" => 87,
      ],
      [
        "id" => 2,
        "name" => "得意先02",
        "kana" => "",
        "zip_code" => "101-0002",
        "address1" => "住所102",
        "address2" => "住所202",
        "tel" => "01-0200-0001",
        "fax" => "02-0200-0001",
        "fraction" => 2,
        "corporate_class" => 4,
        "bank_class" => 1,
        "cutoff_date" => 20,
        "rate" => 80,
      ],
    ]);
    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        "id" => 1,
        "item_number" => "01-402-6212-0",
        "name" => "ITEM01",
        "name_jp" => "商品名01",
        "sales_unit_price" => 1000,
        "is_discontinued" => 0,
        "is_display" => 1,
        "is_set_item" => 1,
      ],
      [
        "id" => 2,
        "item_number" => "01-402-5254-0",
        "name" => "ITEM02",
        "name_jp" => "商品名02",
        "sales_unit_price" => 2000,
        "is_discontinued" => 1,
        "is_display" => 0,
        "is_set_item" => 0,
      ],
    ]);
  }

  // public function testSuccess()
  // {
  //   $mail = [
  //     "from" => "",
  //     "subject" => "",
  //     "body" => ""
  //   ];
  //   $result = $this->service->createReceiveOrderA($mail);
  //   $expected = null;

  //   $this->assertEquals($expected, $result);
  // }

  public function testSuccess2()
  {
    $mail = [
      "body" => "ご担当者 様
　
いつもお世話になっております。
商品の発注をお願いします。

※納品書へ弊社SCMコード(下5桁以上)の記載をお願いします。
※納期が遅れる場合には必ずご返信願います。
　変更がなければ返信は不要です。

=======================================================================
担当 CS_OD2　E-mail 送信元（from）にご返信願います。
=======================================================================

SCMコード：210915R02109
　
TOURATECH ツアラテック ハンドルバーライザーブリッジ
20mmアップ
品番[01-402-5254-0]
JAN[01-402-5254-0]
HONDA CRF1000Lアフリカツイン  ※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。
定価(税込) ¥8,150 × ★1 個★
-------------------------------------------
納期★1ヶ月半★
===========================================
SCM コード：201201R02211
TOURATECH ツアラテック ミディアムウインドスクリーン
品番[01-402-6212-0]
JAN[01-402-6212-0]
HONDA CRF1000L アフリカツイン カラー：スモーク／※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。※アド
ベンチャースポーツは不可です。
定価(税込) ¥24,453 × ★2 個★
-------------------------------------------
納期★1 ヶ月半★
===========================================

--------------------------------------------
株式会社 リバークレイン
TEL 050-5490-7928
FAX 046-244-3212
--------------------------------------------
"
//       "body" => "ご担当者 様
// いつもお世話になっております。
// 商品の発注をお願いします。
// ※納品書へ弊社SCM コード(下5 桁以上)の記載をお願いします。
// ※納期が遅れる場合には必ずご返信願います。
// 変更がなければ返信は不要です。
// =======================================================================
// 担当 CS_OD2 E-mail 送信元（from）にご返信願います。
// =======================================================================
// SCM コード：201201R02211
// TOURATECH ツアラテック ミディアムウインドスクリーン
// 品番[01-402-6212-0]
// JAN[01-402-6212-0]
// HONDA CRF1000L アフリカツイン カラー：スモーク／※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。※アド
// ベンチャースポーツは不可です。
// 定価(税込) ¥24,453 × ★2 個★
// -------------------------------------------
// 納期★1 ヶ月半★
// ===========================================
// --------------------------------------------
// 株式会社 リバークレイン
// TEL 050-5490-7928
// FAX 046-244-3212
// --------------------------------------------"
    ];
    $result = $this->service->createReceiveOrderA($mail);
    $expected = [
      [
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
        "shipping_amount" => 800,
        "fee" => 0,
        "discount" => 0,
        "total_amount" => 2400,
        "order_no" => "210915R02109",
        "remarks" => "納期★1ヶ月半★",
        "rate" => 80,
        "fraction" => 2,
        "details" => [
          [
            'item_kind' => 1,
            'item_id' => 2,
            'item_number' => "01-402-5254-0",
            'item_name' => "ITEM02",
            'item_name_jp' => "商品名02",
            'sales_unit_price' => "2000.00",
            'fraction' => 2,
            'rate' => 80,
            'unit_price' => "1600.00",
            'quantity' => 1,
            'amount' => 1600,
            'sales_tax_rate' => 10,
            'sales_tax' => 146,
          ],
        ],
      ],
      [
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
        "shipping_amount" => 800,
        "fee" => 0,
        "discount" => 0,
        "total_amount" => 2400,
        "order_no" => "201201R02211",
        "remarks" => "納期★1 ヶ月半★",
        "rate" => 80,
        "fraction" => 2,
        "details" => [
          [
            'item_kind' => 2,
            'item_id' => 1,
            'item_number' => "01-402-6212-0",
            'item_name' => "ITEM01",
            'item_name_jp' => "商品名01",
            'sales_unit_price' => "1000.00",
            'fraction' => 2,
            'rate' => 80,
            'unit_price' => "800.00",
            'quantity' => 2,
            'amount' => 1600,
            'sales_tax_rate' => 10,
            'sales_tax' => 146,
          ],
        ],
      ],
    ];

    $this->assertEquals($expected, $result);
  }
}