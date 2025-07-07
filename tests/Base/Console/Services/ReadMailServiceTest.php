<?php

namespace Tests\Base\Console\Services;

use App\Base\Console\Services\ReadMailService;
use App\Base\Models\Item;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class ReadMailServiceTest extends TestCase
{
  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

    $this->service = new ReadMailService();

    config()->set('const.mail.customer_id.rivercrane', 2);
    config()->set('const.mail.mail_a.from', 'order1@webike.net');
    config()->set('const.mail.mail_b.from', 'info@touratechjapan.com');

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('receive_order_details')->delete();
    DB::table('receive_orders')->delete();

    DB::table('configs')->delete();
    DB::table('configs')->insert([[
      'id' => 1,
      'company_name' => '',
      'zip_code' => '',
      'address1' => '',
      'address2' => '',
      'tel' => '',
      'fax' => '',
      'email' => '',
      'account_name1' => '',
      'bank_name1' => '',
      'branch_name1' => '',
      'account_type1' => '',
      'account_number1' => '',
      'account_name2' => '',
      'bank_name2' => '',
      'branch_name2' => '',
      'account_type2' => '',
      'account_number2' => '',
      'company_level' => '',
      'sales_tax_rate' => 10,
      'pre_tax_rate' => 8,
      'tax_rate_change_date' => '2019-10-01',
    ]]);
    DB::table("customers")->delete();
    DB::table('customers')->insert([
      [
        "id" => 1,
        "name" => "得意先01",
        "kana" => "",
        "zip_code" => "101-0001",
        "address1" => "住所101",
        "address2" => "住所201",
        "tel" => "01-0100-0001",
        "fax" => "02-0100-0001",
        "fraction" => 1,
        "corporate_class" => 3,
        "bank_class" => 2,
        "cutoff_date" => 29,
        "rate" => 87,
      ],
      [
        "id" => 2,
        "name" => "得意先02",
        "kana" => "",
        "zip_code" => "101-0002",
        "address1" => "住所102",
        "address2" => "住所202",
        "tel" => "01-0200-0001",
        "fax" => "02-0200-0001",
        "fraction" => 2,
        "corporate_class" => 4,
        "bank_class" => 1,
        "cutoff_date" => 20,
        "rate" => 80,
      ],
    ]);
    DB::table('items')->delete();
    DB::table('items')->insert([
      [
        "id" => 1,
        "item_number" => "01-000-0001-0",
        "name" => "ITEM01",
        "name_jp" => "商品名01",
        "sales_unit_price" => 1000,
        "is_discontinued" => 0,
        "is_display" => 1,
        "is_set_item" => 1,
      ],
    ]);
  }

  /**
   * @runInSeparateProcess
   * @preserveGlobalState disabled
   */
  public function testSuccess()
  {
    $mock = Mockery::mock('overload:'.Item::class)->makePartial();
    
    $m = new Item();
    $m->id = 1;
    $m->item_number = "01-000-0001-0";
    $m->name = "";
    $m->name_jp = "";
    $m->sales_unit_price = 100;
    $m->is_set_item = 0;
    $mock->shouldReceive('where->first')->andReturn($m);

    $files = Storage::files('test/console/parseTest/b_prod');

    foreach ($files as $file) {
      $data = Storage::get($file);
      try {
        $mail = $this->service->parse($data);
        Log::debug($mail);
        $order = [];
        if ($this->service->isPatternA($mail)) {
          $order = $this->service->createReceiveOrderA($mail);
        } else if ($this->service->isPatternB($mail)) {
          $order = $this->service->createReceiveOrderB($mail);
        }
  
        if (!empty($order)) {
          $this->service->store($order);
        }
      } catch (Exception $e) {
        Log::debug($e);
      }
    }
  }

  // public function testA()
  // {
  //   $line = "  ZEGA Bag 45L  01-050-0847-0         8,965円       1    8,965円";
  //   if (preg_match('/^.*\s+([a-zA-Z0-9\-]+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*(?:\d+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*$/', $line, $matches)) {
  //     $this->assertEquals("01-050-0847-0", $matches[1]);
  //   }
  // }
}