<?php

namespace App\Api\Item\Services;

use App\Base\Models\Config;
use App\Base\Pdf\ItemBarcodeInterface;
use App\Base\Pdf\PdfWrapper;
use App\Base\Pdf\ItemBarcodeTrait;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

/**
 * 商品マスタPDFサービス
 */
class ItemPdfService implements ItemBarcodeInterface
{
  use ItemBarcodeTrait;

  /** @var string */
  protected $base_path;

  /**
   * コンストラクタ
   */
  public function __construct()
  {
    $this->base_path = config('const.paths.item.output_path');
  }

  /**
   * パスを取得する
   *
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
    $this->pdf = new PdfWrapper("ラベル ");

    $this->write($data);

    $prefix = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path = app_storage_path($this->getStoragePath($file_id));

    $this->pdf->Output($path, 'F');
    return $file_id;
  }

  /**
   * パスを取得する
   *
   * @param string $file_id ファイルID
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
   * @param array $data 出力データ
   */
  protected function write(array $data)
  {
    $data = new Collection($data);
    $this->pdf->addPage();

    $config = Config::getSelf();
    $sales_tax_rate = $config->getSalesTaxRate();

    $item_number = $data->get('item_number');
    $name = $data->get('name_label');
    $sales_unit_price = $data->get('sales_unit_price');

    $selected = $data->get('selected');

    $this->pdf->AddFont('meiryo');
    $this->pdf->AddFont('meiryob');
    $this->pdf->AddFont('helvetica');

    $i = 1;
    for ($r = 1; $r <= 8; $r++) {
      for ($c = 1; $c <= 3; $c++) {
        $x = self::START_X + ($c - 1) * self::X_WIDTH;
        $y = self::START_Y + ($r - 1) * self::Y_HEIGHT;

        if (in_array($i, $selected) ) {
          $this->writeLabel($x, $y, $item_number, $name, $sales_unit_price, $c);
        }
        $i++;
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