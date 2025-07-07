<?php

namespace Tests\Api\Invoice\Services;

use App\Api\Invoice\Services\InvoiceListPdfService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InvoiceListPdfServiceCreatePdfTest extends TestCase
{
  protected $service;

  public function testSuccess()
  {
    config()->set('const.paths.invoice.output_path', 'test/invoice/');
    $this->service = new InvoiceListPdfService();

    $data = [];
    for ($i = 0; $i < 2; $i++) {
      $data[] = [
          'invoice_date' => '2021/01/02',
          'customer_name' => '得意先ー＋－－－－１－－－－＋－－－－２－－－－＋－－－－３－－－－＋－－－－４'.($i + 1),
          'pre_amount' => 10000000000.00 + $i,
          'total_receipt' => 20000000000.00 + $i,
          'total_amount' => 30000000000.00 + $i,
          'total_tax' => 40000000000.00 + $i,
          'total_invoice' => 50000000000.00 + $i,
      ];
    }

    $file_id = $this->service->createPdf([
      'invoice_month' => "2021/01",
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