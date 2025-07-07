<?php

namespace Tests\Base\Console\Commands;

use Tests\TestCase;

class ReadMailCommandTest extends TestCase
{
  public function testSuccess()
  {
    $this->artisan('command:read_mail --test')
      ->assertExitCode(0);
  }
}