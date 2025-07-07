<?php

namespace Tests\Api\InventoryImport\Services;

use App\Api\InventoryImport\Services\InventoryImportPdfService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InventoryImportPdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  public function testSuccess()
  {
    config()->set('const.paths.inventory_import.output_path', 'test/inventory_import/');
    $this->service = new InventoryImportPdfService();

    $data = [];
    for ($i = 0; $i < 10; $i++) {
      $data[] = [
          'item_number' => '000-0000-0000',
          'item_name' => '商品名'.($i + 1),
          'quantity' => 10000.00 + $i,
          'stock' => 20000.00 + $i,
      ];
    }

    $file_id = $this->service->createPdf([
      'inventory_month' => "2021/01",
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