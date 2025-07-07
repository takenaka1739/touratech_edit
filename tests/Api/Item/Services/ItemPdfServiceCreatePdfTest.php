<?php

namespace Tests\Api\Item\Services;

use App\Api\Item\Services\ItemPdfService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ItemPdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  protected function setUp(): void
  {
    parent::setUp();

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
  }


  public function testSuccess()
  {
    config()->set('const.paths.item.output_path', 'test/item/');
    $this->service = new ItemPdfService();
    $this->service->debug = true;

    $file_id = $this->service->createPdf([
      'item_number' => "01-070-0192-0",
      // 'name_label' => 'Telescopic aluminium',
      // 'sales_unit_price' => 15100,
      // 'name_label' => 'Stainless steel plat',
      'name_label' => 'テスト日本語テスト１－－－－＋－－－－２－－－－＋－－－－３－－－－＋－－－－４',
      // 'name_label' => 'ABCDEFGHI1----+----2----+----3----+----4',
      // 'name_label' => 'ｱｲｳｴｵｶｷｸｹ1----+----2----+----3----+----4',
      'sales_unit_price' => 999999,
      'selected' => [1, 2, 3, 4, 5, 6],
    ]);
    $path = app_storage_path($this->service->getStoragePath($file_id));
    rename($path, $this->getNewPath());
  }

  private function getNewPath(string $file_name = 'test.pdf')
  {
    $path = $this->service->getBasePath();
    Storage::makeDirectory($path);
    return app_storage_path($path . $file_name);
  }
}