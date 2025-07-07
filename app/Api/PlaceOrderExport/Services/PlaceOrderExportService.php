<?php

namespace App\Api\PlaceOrderExport\Services;

use App\Base\Models\Config;
use App\Base\Models\PlaceOrder;
use App\Base\Models\Supplier;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Exception;

/**
 * 発注確定サービス
 */
class PlaceOrderExportService
{
  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.place_order.output_path');
  }

  /**
   * ZIPファイルを作成する
   *
   * @param array $cond 条件
   * @return string|null
   */
  public function createZip(array $cond)
  {
    $cond = new Collection($cond);
    $output_name = "Order";
    $prefix = Carbon::now()->format('Ymd');
    $prefix_tmp = $prefix . '/' . Str::random(20);
    $suffix = Carbon::now()->format('YmdH');

    // 発注データを取得する
    $rows = $this->getPlaceOrders($cond);
    if (count($rows) == 0) {
      return null;
    }

    $groups = $rows->groupBy('supplier_id');
    $suppliers = Supplier::select([
      'id',
      'output_no',
    ])
      ->whereNotNull('output_no')
      ->get();

    $configSupplierId = Config::getSupplierId();
    $configFileName = '';

    $file_names = [];
    foreach ($groups as $id => $data) {
      $no = "";
      $s = $suppliers->where('id', $id);
      if ($s) {
        $no = $s->first()->output_no;
      }
      if (empty($no)) {
        throw new Exception("ファイルの作成に失敗しました。");
      }
      $file_name = $output_name . "_" . $no . "_" . $suffix . ".csv";
      $path = $this->getTmpStoragePath($prefix_tmp, $file_name);
      $csv = $this->getCsv($data);
      if (Storage::put($path, $csv)) {
      } else {
        throw new Exception("ファイルの作成に失敗しました。");
      }
      $file_names[] = $file_name;

      if ($configSupplierId == $id) {
        $configFileName = $file_name;
      }
    }

    $zip_file_id = $this->getFileId($prefix);
    $zip_path = app_storage_path($this->getStoragePath($zip_file_id));

    $zip = new ZipArchive();
    $zip->open($zip_path, ZipArchive::CREATE);
    foreach ($file_names as $file_name) {
      $zip->addFile(app_storage_path($this->getTmpStoragePath($prefix_tmp, $file_name)), $file_name);
    }
    $zip->close();

    if (!empty($configFileName)) {
      $this->updateFileName($cond, $configSupplierId, $configFileName);
    }

    return $zip_file_id;
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

    list($path, $file_name) = explode('_', $file_id);
    return $this->base_path . $path . DIRECTORY_SEPARATOR . $file_name;
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

  /**
   * 一時ファイルのパスを取得する
   *
   * @param string $prefix_tmp
   * @param string $file_name
   * @return string
   */
  private function getTmpStoragePath(string $prefix_tmp, string $file_name)
  {
    return $this->base_path . $prefix_tmp . DIRECTORY_SEPARATOR . $file_name;
  }

  /**
   * 発注データを取得する
   *
   * @param Collection $cond
   */
  private function getPlaceOrders($cond)
  {
    $query = PlaceOrder::select(
      'items.supplier_id',
      'place_order_details.item_number',
      DB::raw('SUM(place_order_details.quantity) AS quantity')
    );
    $query = $this->setCondition($query, $cond);

    $query->groupBy('items.supplier_id', 'place_order_details.item_number');

    return $query->get();
  }

  /**
   * 
   * @param Collection $cond
   */
  private function setCondition($query, $cond)
  {
    $place_order_date_from = $cond->get('c_place_order_date_from');
    $place_order_date_to = $cond->get('c_place_order_date_to');
    $is_output = $cond->get('c_is_output');

    $place_order_date_to = new Carbon($place_order_date_to);

    $query->join('place_order_details', 'place_order_details.place_order_id', '=', 'place_orders.id')
      ->join('items', 'items.id', '=', 'place_order_details.item_id')
      ->where('place_order_date', '>=', $place_order_date_from)
      ->where('place_order_date', '<', $place_order_date_to->addDay())
      ->whereNotNull('place_order_details.item_number');

    if (!$is_output) {
      $query->whereNull('place_orders.order_file_name');
    }

    return $query;
  }

  /**
   * CSVを取得する
   *
   * @param collection $rows
   * @return string
   */
  private function getCsv($rows)
  {
    $csv = "";
    $csv .= "Part,Quantity\n";
    foreach ($rows as $row) {
      $csv .= ($row->item_number ?? "") . ",";
      $csv .= $row->quantity ?? 0;
      $csv .= "\n";
    }
    $csv = mb_convert_encoding($csv, "SJIS-win");
    return $csv;
  }

  /**
   * @param Collection $cond
   * @param int $supplierId
   * @param string $fileName
   */
  private function updateFileName($cond, $supplierId, $fileName)
  {
    $place_order_date_from = $cond->get('c_place_order_date_from');
    $place_order_date_to = $cond->get('c_place_order_date_to');
    $is_output = $cond->get('c_is_output');

    $place_order_date_to = new Carbon($place_order_date_to);

    $query = DB::table('place_orders')
      ->where('place_order_date', '>=', $place_order_date_from)
      ->where('place_order_date', '<', $place_order_date_to->addDay())
      ->whereExists(function ($q) use ($supplierId) {
        $q->select(DB::raw(1))
          ->from('place_order_details')
          ->join('items', 'items.id', '=', 'place_order_details.item_id')
          ->whereRaw('place_order_details.place_order_id = place_orders.id')
          ->where('items.supplier_id', '=', $supplierId);
      });

    if (!$is_output) {
      $query->whereNull('place_orders.order_file_name');
    }

    $query->update([
      'order_file_name' => $fileName,
    ]);
  }
}