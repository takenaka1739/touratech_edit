<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\Log;
use ReflectionClass;
use Tests\TestCase;

class ReadMailServiceGetItemsATest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getItemsA');
    $this->method->setAccessible(true);

  }

  // public function testSuccessNoData()
  // {
  //   $body = "";
  //   $result = $this->method->invoke($this->service, $body);
  //   $expected = [];

  //   $this->assertEquals($expected, $result);
  // }

  public function testSuccess()
  {
    $body = "ご担当者 様
　
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
SCMコード：210915R02102
　
TOURATECH ツアラテック ハンドルバーライザーブリッジ
20mmアップ
品番[01-402-5254-1]
JAN[01-402-5254-0]
HONDA CRF1000Lアフリカツイン  ※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。
定価(税込) ¥8,150 × ★1 個★
-------------------------------------------
納期★1ヶ月半★
===========================================


--------------------------------------------
株式会社 リバークレイン
TEL 050-5490-7928
FAX 046-244-3212
--------------------------------------------
";
    $result = $this->method->invoke($this->service, $body);
    $expected = [
      "SCMコード：210915R02109
　
TOURATECH ツアラテック ハンドルバーライザーブリッジ
20mmアップ
品番[01-402-5254-0]
JAN[01-402-5254-0]
HONDA CRF1000Lアフリカツイン  ※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。
定価(税込) ¥8,150 × ★1 個★
-------------------------------------------
納期★1ヶ月半★
===========================================
",
      "SCMコード：210915R02102
　
TOURATECH ツアラテック ハンドルバーライザーブリッジ
20mmアップ
品番[01-402-5254-1]
JAN[01-402-5254-0]
HONDA CRF1000Lアフリカツイン  ※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。
定価(税込) ¥8,150 × ★1 個★
-------------------------------------------
納期★1ヶ月半★
===========================================


--------------------------------------------
株式会社 リバークレイン
TEL 050-5490-7928
FAX 046-244-3212
--------------------------------------------

",
    ];

    $this->assertEquals($expected, $result);
  }

}