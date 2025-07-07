<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\Storage;
use ReflectionClass;
use Tests\TestCase;

class ReadMailServiceGetRemarksBTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getRemarksB');
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
    $body = "ショッパーカート から伝票番号3933 で下記のとおりご注文がありました。\n
ご注文番号：3933\n
発注日：2020 年 12 月 04 日\n
発注者：佐藤 三郎 様\n
商品名 型番 詳細 税込単価 注文数 小計\n
-------------------------------------------------------------------------------------------------------------------------------\n
アドベンチャーフォールディングミラー（片側１本） M10x1.25 01-040-0771-0 5,093 円 2 10,186 円\n
CT125 ハンターカブ用ツールボックス JP-CT-5610-0 24,800 円 1 24,800 円\n
CT125 ヘッドライトプロテクタークイックリリース付きステンレスブラック JP-CT-5095-0 14,300 円 1 14,300 円\n
-------------------------------------------------------------------------------------------------------------------------------\n
お買い上げ金額(税込) 49,286 円\n
合計 49,286 円\n
お支払方法：クレジットカード\n
【ご購入者情報】\n
ご購入者氏名：佐藤 太郎 様\n
ご購入者氏名かな：さとう たろう 様\n
ご購入者郵便番号：901-9898\n
ご購入者都道府県：京都府\n
ご購入者郡・市町村・区・町名：京都市伏見区\n
ご購入者建物名・番地など：201-4-99999\n
ご購入者電話番号：090-0000-0001\n
ご購入者メールアドレス：test10101@example.com\n
【お届け先情報】\n
お届け先氏名：佐藤 次郎 様\n
お届け先郵便番号：901-9899\n
お届け先都道府県：大阪府\n
お届け先郡・市町村・区・町名：大阪市\n
お届け先建物名・番地など：4-4\n
お届け先電話番号：090-0000-0002\n
配送希望時間帯：指定なし\n
\n
ご意見、ご要望等ありましたらご記入ください。\n
テスト01 test 0001
\n
以上";
    $result = $this->method->invoke($this->service, $body);
    $expected = "テスト01 test 0001";

    $this->assertEquals($expected, $result);
  }
}