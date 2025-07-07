<?php

namespace App\Api\HomeDataImport\Services;

use App\Base\models\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;
use ZipArchive;
use Exception;

/**
 * 本国商品データ取込出力サービス
 */
class HomeDataImportOutputService
{
  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.home_data_import.output_path');
  }

  /**
   * ZIPファイルを作成する
   *
   * @param array $cond 条件
   * @return string
   */
  public function createZip()
  {
    $prefix = Carbon::now()->format('Ymd');
    $prefix_tmp = $prefix . '/' . Str::random(20);

    $config = Config::getSelf();
    $supplier_id = $config->supplier_id;

    $file_names = [];

    // 新規
    $file_name = "item_new_" . $prefix . ".csv";
    $this->createCsv($prefix_tmp, $file_name, DB::table('item_temporaries')->where('edit_kind', 0)->get());
    $file_names[] = $file_name;

    // 更新
    $file_name = "item_edit_" . $prefix . ".csv";
    $this->createCsv($prefix_tmp, $file_name, DB::table('item_temporaries')->where('edit_kind', 1)->get());
    $file_names[] = $file_name;

    // 削除
    $file_name = "item_del_" . $prefix . ".csv";
    $this->createCsv($prefix_tmp, $file_name, DB::table('item_temporaries')->where('edit_kind', 2)->get());
    $file_names[] = $file_name;

    $zip_file_id = $this->getFileId($prefix);
    $zip_path = app_storage_path($this->getStoragePath($zip_file_id));

    $zip = new ZipArchive();
    $zip->open($zip_path, ZipArchive::CREATE);
    foreach ($file_names as $file_name) {
      $zip->addFile(app_storage_path($this->getTmpStoragePath($prefix_tmp, $file_name)), $file_name);
    }
    $zip->close();

    return $zip_file_id;
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
   * csvファイルを作成する
   *
   * @param string $prefix_tmp
   * @param string $file_name
   * @param \Illuminate\Support\Collection $rows
   */
  private function createCsv($prefix_tmp, $file_name, $rows)
  {
    $csv = "";
    $csv .= "品番,商品名,仕入単価,備考\n";

    foreach ($rows as $row) {
      $csv .= $row->item_number . ',';
      $csv .= $row->name . ',';
      $csv .= $row->purchase_unit_price . ',';
      $csv .= $row->remarks;
      $csv .= "\n";
    }
    $csv = mb_convert_encoding($csv, "SJIS-win");

    $path = $this->getTmpStoragePath($prefix_tmp, $file_name);
    if (Storage::put($path, $csv)) {
    } else {
      throw new Exception("ファイルの作成に失敗しました。");
    }
  }
}