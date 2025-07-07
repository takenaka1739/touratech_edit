<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use ReflectionClass;
use Tests\TestCase;

class ReadMailServiceGetUnitPriceBTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('getUnitPriceB');
    $this->method->setAccessible(true);

  }

  public function testSuccess()
  {
    $line = "";
    $result = $this->method->invoke($this->service, $line);
    $expected = "";

    $this->assertEquals($expected, $result);
  }

  public function testSuccess2()
  {
    $line = "アドベンチャーフォールディングミラー（片側１本） M10x1.25 01-040-0771-0 5,093 円 2 10,186 円";
    $result = $this->method->invoke($this->service, $line);
    $expected = 5093;

    $this->assertEquals($expected, $result);
  }

  public function testSuccess3()
  {
    $line = "CT125 ハンターカブ用ツールボックス JP-CT-5610-0 24,800 円 1 24,800 円";
    $result = $this->method->invoke($this->service, $line);
    $expected = 24800;

    $this->assertEquals($expected, $result);
  }

  public function testSuccess4()
  {
    $line = "CT125 ヘッドライトプロテクタークイックリリース付きステンレスブラック JP-CT-5095-0 14,300 円 1 14,300 円";
    $result = $this->method->invoke($this->service, $line);
    $expected = 14300;

    $this->assertEquals($expected, $result);
  }

}