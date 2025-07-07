<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;

class ReadMailServiceHasCustomerBTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected $method;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();
    $reflection = new ReflectionClass($this->service);
    $this->method = $reflection->getMethod('hasCustomerB');
    $this->method->setAccessible(true);

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('customers')->delete();
    DB::table('customers')->insert([
      [
        'id' => 1,
        'name' => '得意先名01',
        'kana' => 'とくいさきめい０１',
        'zip_code' => '000-0001',
        'address1' => '住所1-01',
        'address2' => '住所2-01',
        'tel' => '000-001-0001',
        'fax' => '111-111-1101',
        'email' => 'test01@example.com',
        'fraction' => 1,
        'corporate_class' => 2,
        'bank_class' => 3,
        'cutoff_date' => 31,
        'rate' => 100,
        'remarks' => '',
      ],
      [
        'id' => 2,
        'name' => '佐藤　太郎',
        'kana' => 'とくいさきめい０２',
        'zip_code' => '000-0002',
        'address1' => '住所1-02',
        'address2' => '住所2-02',
        'tel' => '000-001-0002',
        'fax' => '111-111-1102',
        'email' => 'test02@example.com',
        'fraction' => 1,
        'corporate_class' => 2,
        'bank_class' => 3,
        'cutoff_date' => 31,
        'rate' => 100,
        'remarks' => '',
      ],
      [
        'id' => 3,
        'name' => '山田次郎',
        'kana' => 'とくいさきめい０３',
        'zip_code' => '000-0003',
        'address1' => '住所1-03',
        'address2' => '住所2-03',
        'tel' => '0000010003',
        'fax' => '111-111-1103',
        'email' => 'test03@example.com',
        'fraction' => 1,
        'corporate_class' => 2,
        'bank_class' => 3,
        'cutoff_date' => 31,
        'rate' => 100,
        'remarks' => '',
      ],
    ]);
  }

  public function testSuccess()
  {
    $customer = [
      "customer_name" => "",
      "tel" => "",
    ];
    $result = $this->method->invoke($this->service, $customer);
    $expected = null;

    $this->assertEquals($expected, $result);
  }

  public function testSuccess2()
  {
    $customer = [
      "customer_name" => "佐藤　太郎",
      "tel" => "000-001-0002",
    ];
    $result = $this->method->invoke($this->service, $customer);
    $expected = [
      'id' => 2,
      'name' => '佐藤　太郎',
      'kana' => 'とくいさきめい０２',
      'zip_code' => '000-0002',
      'address1' => '住所1-02',
      'address2' => '住所2-02',
      'tel' => '000-001-0002',
      'fax' => '111-111-1102',
      'email' => 'test02@example.com',
      'fraction' => 1,
      'corporate_class' => 2,
      'bank_class' => 3,
      'cutoff_date' => 31,
      'rate' => 100,
      'remarks' => '',
  ];

    $this->assertEquals($expected, $result->toArray());
  }

  public function testSuccess3()
  {
    $customer = [
      "customer_name" => "佐藤太郎",
      "tel" => "0000010002",
    ];
    $result = $this->method->invoke($this->service, $customer);
    $expected = [
      'id' => 2,
      'name' => '佐藤　太郎',
      'kana' => 'とくいさきめい０２',
      'zip_code' => '000-0002',
      'address1' => '住所1-02',
      'address2' => '住所2-02',
      'tel' => '000-001-0002',
      'fax' => '111-111-1102',
      'email' => 'test02@example.com',
      'fraction' => 1,
      'corporate_class' => 2,
      'bank_class' => 3,
      'cutoff_date' => 31,
      'rate' => 100,
      'remarks' => '',
  ];

    $this->assertEquals($expected, $result->toArray());
  }

}