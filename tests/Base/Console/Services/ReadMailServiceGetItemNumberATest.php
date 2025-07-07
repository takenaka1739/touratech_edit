<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\Storage;
use ReflectionClass;
use Tests\TestCase;

class ReadMailServiceGetItemNumberATest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getItemNumberA');
    $this->method->setAccessible(true);

  }

  public function testSuccess()
  {
    $body = "";
    $result = $this->method->invoke($this->service, $body);
    $expected = "";

    $this->assertEquals($expected, $result);
  }

  public function testSuccess2()
  {
    $body = "ご担当者 様\n
いつもお世話になっております。\n
商品の発注をお願いします。\n
※納品書へ弊社SCM コード(下5 桁以上)の記載をお願いします。\n
※納期が遅れる場合には必ずご返信願います。\n
変更がなければ返信は不要です。\n
=======================================================================\n
担当 CS_OD2 E-mail 送信元（from）にご返信願います。\n
=======================================================================\n
SCM コード：201201R02211\n
TOURATECH ツアラテック ミディアムウインドスクリーン\n
品番[01-402-6212-0]\n
JAN[01-402-6212-0]\n
HONDA CRF1000L アフリカツイン カラー：スモーク／※メーカー都合により商品の仕様変更がある場合がございます。ご了承ください。※アド\n
ベンチャースポーツは不可です。\n
定価(税込) ¥24,453 × ★1 個★\n
-------------------------------------------\n
納期★1 ヶ月半★\n
===========================================\n
--------------------------------------------\n
株式会社 リバークレイン\n
TEL 050-5490-7928\n
FAX 046-244-3212\n
--------------------------------------------";
    $result = $this->method->invoke($this->service, $body);
    $expected = "01-402-6212-0";

    $this->assertEquals($expected, $result);
  }
}