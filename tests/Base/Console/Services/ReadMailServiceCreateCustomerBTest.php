<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class ReadMailServiceCreateCustomerBTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('createCustomerB');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('customers')->delete();
  }

  public function testSuccess()
  {
    $customer = [
      "customer_name" => "佐藤　太郎",
      "customer_kana" => "さとう　たろう",
      "zip_code" => "001-1001",
      "address1" => "住所０１",
      "address2" => "住所０２",
      "tel" => "000-001-0002",
      "email" => "test01@example.com",
    ];
    $result = $this->method->invoke($this->service, $customer);
    $expected = [
      'name' => '佐藤　太郎',
      'kana' => 'さとう　たろう',
      'zip_code' => '001-1001',
      'address1' => '住所０１',
      'address2' => '住所０２',
      'tel' => '000-001-0002',
      'email' => 'test01@example.com',
      'fraction' => 3,
      'corporate_class' => 1,
      'bank_class' => 1,
      'cutoff_date' => 31,
      'rate' => 100,
    ];

    $this->assertEquals($expected, $result->toArray());
  }
}