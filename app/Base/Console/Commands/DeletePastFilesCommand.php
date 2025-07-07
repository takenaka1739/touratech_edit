<?php

namespace App\Base\Console\Commands;

use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DeletePastFilesCommand extends Command
{
  protected $signature = 'command:deletePastFiles';

  protected $description = "1ヶ月より前のファイルを削除する。";

  public function handle()
  {
    $this->info("delete start.");

    $past = Carbon::now()->addMonths(-1)->format("Ymd");

    // estimate
    $this->deletePast(config('const.paths.estimate.output_path'), $past);

    // hiden
    $this->deletePast(config('const.paths.hiden.output_path'), $past);

    // home_data_import
    $this->deletePast(config('const.paths.home_data_import.output_path'), $past);

    // inventory_import
    $this->deletePast(config('const.paths.inventory_import.output_path'), $past);

    // inventory_printing
    $this->deletePast(config('const.paths.inventory_printing.output_path'), $past);

    // invoice
    $this->deletePast(config('const.paths.invoice.output_path'), $past);

    // item
    $this->deletePast(config('const.paths.item.output_path'), $past);

    // place_order
    $this->deletePast(config('const.paths.place_order.output_path'), $past);

    // receive_order
    $this->deletePast(config('const.paths.receive_order.output_path'), $past);

    // sales
    $this->deletePast(config('const.paths.sales.output_path'), $past);

    // shipment_plan
    $this->deletePast(config('const.paths.shipment_plan.output_path'), $past);

    $this->info("delete complete.");
  }

  /**
   * delete past directory.
   *
   * @param string $path
   * @param string $past
   */
  private function deletePast(string $path, string $past)
  {
    if (!Storage::exists($path)) {
      return;
    }

    $directories = Storage::directories($path);
    foreach ($directories as $directory) {
      $dirs = explode('/', $directory);
      $dir = end($dirs);
      if ($dir < $past) {
        Storage::deleteDirectory($directory);
      }
    }
  }
}