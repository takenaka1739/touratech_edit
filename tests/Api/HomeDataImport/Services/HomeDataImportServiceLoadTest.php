<?php

namespace Tests\Api\HomeDataImport\Services;

use App\Api\HomeDataImport\Services\HomeDataImportService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ReflectionClass;
use Tests\TestCase;

class HomeDataImportServiceLoadTest extends TestCase
{
  /** @var \App\Api\HomeDataImport\Services\HomeDataImportService */
  protected $service;

  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new HomeDataImportService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('load');
    $this->method->setAccessible(true);
  }

  public function testSuccess()
  {
    $path = storage_path('app/test/home_data_import/test.dbf');
    $actual = $this->method->invoke($this->service, $path);
    $expected = [];
    $this->assertEquals($expected, $actual);
  }
}