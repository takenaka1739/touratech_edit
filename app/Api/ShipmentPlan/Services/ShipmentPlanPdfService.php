<?php

namespace App\Api\ShipmentPlan\Services;

use App\Base\Models\Config;
use App\Base\Pdf\ItemBarcodeInterface;
use App\Base\Pdf\PdfWrapper;
use App\Base\Pdf\ItemBarcodeTrait;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

/**
 * 発送予定一覧PDFサービス
 */
class ShipmentPlanPdfService implements ItemBarcodeInterface
{
  use ItemBarcodeTrait;

  const PER_PAGE = 24;

  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.shipment_plan.output_path');
  }

  /**
   * @return string
   */
  public function getBasePath()
  {
    return $this->base_path;
  }

  /**
   * PDFを作成する
   *
   * @param array $data
   * @return string
   */
  public function createPdf(array $data)
  {
    $data = new Collection($data);
    $rows = $data->get('data');

    $this->pdf = new PdfWrapper("ラベル");

    $this->write($rows);

    $prefix = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path = app_storage_path($this->getStoragePath($file_id));

    $this->pdf->Output($path, 'F');
    return $file_id;
  }

  /**
   * パスを取得する
   *
   * @param string $file_id
   * @return string
   */
  public function getStoragePath(string $file_id)
  {
    if (!strpos($file_id, '_')) {
      throw new Exception("Failed get path.");
    }

    list($ymd, $file_name) = explode('_', $file_id);
    $path = $this->base_path . $ymd . DIRECTORY_SEPARATOR;

    Storage::makeDirectory($path);

    return $path . $file_name;
  }

  /**
   * 書き込む
   *
   * @param array $rows
   */
  protected function write(array $rows)
  {
		$this->pdf->AddFont('meiryo');
		$this->pdf->AddFont('meiryob');

    $count = count($rows);
    $max_page = Ceil($count / $this::PER_PAGE);

    for ($i = 1; $i <= $max_page; $i++) {
      $this->writePage($rows, $i);
    }
  }

  /**
   * ページを出力する
   *
   * @param array $rows
   * @param int $page
   */
  protected function writePage(
    array $rows,
    int $page
    )
  {
    $rows = new Collection($rows);
    $data = $rows->forPage($page, $this::PER_PAGE);

    $this->pdf->addPage();

    $this->pdf->AddFont('meiryo');
    $this->pdf->AddFont('meiryob');
    $this->pdf->AddFont('helvetica');

    $r = 1;
    $c = 1;
    foreach ($data as $row) {
      $x = self::START_X + ($c - 1) * self::X_WIDTH;
      $y = self::START_Y + ($r - 1) * self::Y_HEIGHT;

      $row = new Collection($row);
      $this->writeLabel(
        $x,
        $y,
        $row->get('item_number'),
        $row->get('name_label'),
        $row->get('sales_unit_price'),
        $c
      );

      $c++;
      if ($c > 3) {
        $r++;
        $c = 1;
      }
    }
  }

  /**
   * ファイルIDを取得する
   *
   * @param string $prefix
   * @return string
   */
  private function getFileId(string $prefix)
  {
    return $prefix . "_" . Str::random(32);
  }
}