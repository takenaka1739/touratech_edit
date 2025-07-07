<?php

namespace Tests\Api\InventoryPrinting\Services;

use App\Api\InventoryPrinting\Services\InventoryPrintingPdfService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InventoryPrintingPdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  public function testSuccess()
  {
    config()->set('const.paths.inventory_printing.output_path', 'test/inventory_printing/');
    $this->service = new InventoryPrintingPdfService();

    $data = [];
    // for ($i = 0; $i < 40; $i++) {
    //   $data[] = [
    //       'item_number' => '000-0000-0000',
    //       'item_name' => '商品名'.($i + 1),
    //       'pre_quantity' => 10000.00 + $i,
    //       'in' => 20000.00 + $i,
    //       'out' => 30000.00 + $i,
    //       'quantity' => 40000.00 + $i,
    //       'unit_price' => 50000.00 + $i,
    //       'amount' => 60000.00 + $i,
    //   ];
    // }
    $data[] = [
      'item_number' => '000-0000-0000',
      'item_name' => '１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠１２３４５６７８９＠',
      'pre_quantity' => 10001.00,
      'in' => 20000.00,
      'out' => 30000.00,
      'quantity' => 40000.00,
      'unit_price' => 50000.00,
      'amount' => 60000.00,
    ];
    $data[] = [
      'item_number' => '000-0000-0000',
      'item_name' => '123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@123456789@',
      'pre_quantity' => 10001.00,
      'in' => 20000.00,
      'out' => 30000.00,
      'quantity' => 40000.00,
      'unit_price' => 50000.00,
      'amount' => 60000.00,
    ];

    $file_id = $this->service->createPdf([
      'import_month' => "2021/01",
      'data' => $data,
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