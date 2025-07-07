<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReadMailServiceIsPatternATest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
  }

  public function testSuccess()
  {
    config()->set('const.mail.mail_a.from', 'test@example.com');

    $result = $this->service->isPatternA([
      'from' => 'test@example.com',
      'subject' => '発注依頼',
    ]);

    $this->assertEquals(true, $result);
  }

  public function testSuccess2()
  {
    config()->set('const.mail.mail_a.from', 'test@example.com');

    $result = $this->service->isPatternA([
      'from' => 'test@example.com',
      'subject' => '本時の発注依頼です。',
    ]);

    $this->assertEquals(true, $result);
  }

  public function testFail()
  {
    config()->set('const.mail.mail_a.from', 'test@example.com');

    $result = $this->service->isPatternA([
      'from' => 'test2@example.com',
      'subject' => '発注依頼',
    ]);

    $this->assertEquals(false, $result);
  }

  public function testFail2()
  {
    config()->set('const.mail.mail_a.from', 'test@example.com');

    $result = $this->service->isPatternA([
      'from' => 'test@example.com',
      'subject' => '発注 依頼',
    ]);

    $this->assertEquals(false, $result);
  }

}