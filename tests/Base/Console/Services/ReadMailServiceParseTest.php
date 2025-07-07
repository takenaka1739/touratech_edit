<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReadMailServiceParseTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
  }

  // public function testSuccess()
  // {
  //   $result = $this->service->parse("");
  //   $expected = [];

  //   $this->assertEquals($expected, $result);
  // }

  // public function testSuccess2()
  // {
  //   $input = Storage::get('test/console/winmail.dat');

  //   $result = $this->service->parse($input);
  //   $expected = [
  //     'from' => "",
  //     'subject'=> "",
  //     'body' => "",
  //   ];

  //   $this->assertEquals($expected, $result);
  // }

  public function testSuccess3()
  {
    $files = Storage::files('test/console/parseTest/b_dev');

    foreach ($files as $file) {
      $data = Storage::get($file);
      $result = $this->service->parse($data);
      Log::debug($result);
    }
  }

}