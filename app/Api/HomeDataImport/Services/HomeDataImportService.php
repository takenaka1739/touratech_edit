<?php

namespace App\Api\HomeDataImport\Services;

use App\Base\Models\Config;
use App\Base\Models\ConfigCurrency;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Reader\Xls;

/**
 * 本国商品データ取込サービス
 */
class HomeDataImportService
{
  const EDIT_KIND_INSERT = 0;
  const EDIT_KIND_UPDATE = 1;
  const EDIT_KIND_DELETE = 2;

  /**
   * アップロード
   *
   * @param string $path
   */
  public function upload(string $path)
  {
    set_time_limit(600);

    // ファイルを読み込む
    $tmps = $this->load($path);

    set_time_limit(600);

    // 読み込んだデータを登録用に編集する
    $rows = $this->edit($tmps);

    DB::transaction(function() use ($rows) {
      DB::table('item_temporaries')->delete();
      DB::table('item_temporaries')->insert($rows);

      // 商品を新規追加する
      $this->insertItems();

      // 商品を更新する（廃盤以外）
      $this->updateItemsNotDiscontinued();

      // 商品を更新する（廃盤）
      $this->updateItemsDiscontinued();
    });
  }

  /**
   * ファイルを読み込む
   *
   * @param string $path
   * @return array
   */
  private function load(string $path)
  {
    $reader = new Xls();
    $reader->setReadDataOnly(true);
    $spreadsheet = $reader->load($path);
    $sheet = $spreadsheet->getSheet(0);

    $rowIndex = $sheet->getHighestRow();
    while($sheet->getCell("A{$rowIndex}")->getValue() == null) {
      $rowIndex--;

      if ($rowIndex <= 0) {
        throw new Exception("ファイルの読み込みに失敗しました");
      }
    }

    $tmps = [];
    if ($rowIndex > 1) {
      $data = $sheet->rangeToArray("A2:W".$rowIndex, null, false, false);
      foreach ($data as $row) {
        $tmps[] = [
          'artikelnr' => $row[0],
          'english' => $row[3],
          'level_A' => $row[9],
          'level_B' => $row[10],
          'level_C' => $row[11],
          'level_D' => $row[12],
          'demo' => $row[13],
          'discontinued_with_stock' => $row[22],
          'stock' => $row[20],
        ];
      }
    }
    return $tmps;
  }

  /**
   * 読み込んだデータを登録用に編集する
   *
   * @param array $tmps
   * @return array
   */
  private function edit(array $tmps)
  {
    $config = Config::getSelf();
    $supplier_id = $config->supplier_id;
    $company_level = $config->company_level;
    $rate = ConfigCurrency::getEuroRate();

    // 現在の商品データを取得する（セット品を除く）
    $items = DB::table('items')->where('is_set_item', false)->get()->keyBy('item_number');

    $rows = [];
    foreach ($tmps as $tmp) {
      $tmp = new Collection($tmp);

      $price = (float)$tmp->get('demo', 0);
      $item_number = $tmp->get('artikelnr');

      if ($item_number) {
        $item = $items->has($item_number) ? $items->get($item_number) : null;
        $purchase_unit_price = (float)$tmp->get('level_'.$company_level, 0);
        $is_discontinued = $tmp->get('discontinued_with_stock') ? true : false;

        // 編集区分
        $edit_kind = $this::EDIT_KIND_INSERT;
        if ($item) {
          $edit_kind = $this::EDIT_KIND_UPDATE;
        }
        $remarks = "";
        // 商品が存在し、値が違う場合は備考を編集する
        if ($item) {
          if ($purchase_unit_price != $item->purchase_unit_price) {
            $remarks .= $remarks ? "　" : "";
            $remarks .= "仕入単価：".$item->purchase_unit_price."->".$purchase_unit_price;
          }
          if ($is_discontinued != $item->is_discontinued) {
            $remarks .= $remarks ? "　" : "";
            $remarks .= "廃盤予定：".$item->is_discontinued."->".$is_discontinued;
          }
        }
        $overseas_stock = $tmp->get('stock', 0);
        if (!is_numeric($overseas_stock)) {
          $overseas_stock = 0;
        }

        $rows[] = [
          'item_number' => $item_number,
          'name' => $tmp->get('english'),
          'purchase_unit_price' => bcmul($purchase_unit_price, $rate, 2),
          'sample_price' => bcmul($price, $rate, 2),
          'supplier_id' => $supplier_id,
          'is_discontinued' => $is_discontinued,
          'overseas_stock' => $overseas_stock,
          'edit_kind' => $edit_kind,
          'remarks' => $remarks,
        ];
      }
    }
    return $rows;
  }

  /**
   * 商品を新規追加する
   */
  private function insertItems()
  {
    DB::insert("INSERT INTO items (item_number
      , name
      , purchase_unit_price
      , sample_price
      , supplier_id
      , is_discontinued
      , is_display
      , overseas_stock
      , created_at
      , updated_at)
    SELECT item_number
      , name
      , purchase_unit_price
      , sample_price
      , supplier_id
      , is_discontinued
      , 1
      , overseas_stock
      , CURRENT_TIMESTAMP
      , CURRENT_TIMESTAMP
    FROM item_temporaries WHERE item_temporaries.edit_kind = ".$this::EDIT_KIND_INSERT);
  }

  /**
   * 商品を更新する（廃盤以外）
   */
  private function updateItemsNotDiscontinued()
  {
    DB::update("UPDATE items a
      INNER JOIN item_temporaries b ON b.item_number = a.item_number AND b.supplier_id = a.supplier_id AND b.edit_kind = ".$this::EDIT_KIND_UPDATE."
    SET a.name = b.name
      , a.purchase_unit_price = b.purchase_unit_price
      , a.sample_price = b.sample_price
      , a.supplier_id = b.supplier_id
      , a.is_discontinued = b.is_discontinued
      , a.overseas_stock = b.overseas_stock
      , a.updated_at = CURRENT_TIMESTAMP");
  }

  /**
   * 商品を更新する（廃盤）
   */
  private function updateItemsDiscontinued()
  {
    $config = Config::getSelf();
    $supplier_id = $config->supplier_id;

    DB::insert("INSERT INTO item_temporaries (item_number
      , name
      , purchase_unit_price
      , sample_price
      , supplier_id
      , is_discontinued
      , overseas_stock
      , edit_kind
      , remarks)
    SELECT item_number
      , name
      , purchase_unit_price
      , sample_price
      , supplier_id
      , is_discontinued
      , overseas_stock
      , 2
      , NULL
    FROM items
    WHERE NOT EXISTS (SELECT * FROM item_temporaries WHERE item_temporaries.item_number = items.item_number AND item_temporaries.supplier_id = items.supplier_id)
    AND supplier_id = ". $supplier_id .";");

    DB::update("UPDATE items a
      INNER JOIN item_temporaries b ON b.item_number = a.item_number AND b.supplier_id = a.supplier_id AND b.edit_kind = ".$this::EDIT_KIND_DELETE."
    SET a.discontinued_date = CURRENT_DATE
      , a.overseas_stock = 0");
  }
}
