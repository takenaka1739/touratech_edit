<?php

namespace App\Api\InventoryImport\Services;

use App\Base\Models\Inventory;
use App\Base\Models\Item;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;

/**
 * 棚卸処理サービス
 */
class InventoryImportService
{
  /**
   * 
   */
  public function fetch(array $data)
  {
    $query = DB::table('inventory_imports')
      ->select([
        'inventory_imports.import_month',
        'inventory_imports.item_number',
        'inventory_imports.quantity',
        'inventory_imports.stocks',
        'inventory_imports.unmatch',
        'items.name_jp AS item_name',
      ])
      ->leftJoin('items', 'items.item_number', '=', 'inventory_imports.item_number');
      $query = $this->setCondition($query, $data);
      $query->orderBy('item_number');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 棚卸データが存在する場合true
   * 
   * @param array $data
   * @return bool
   */
  public function hasInventory(array $data)
  {
    $data = new Collection($data);
    $inventory_month = $data->get('c_inventory_month');
    return Inventory::where('import_month', $inventory_month)->exists();
  }

  /**
   * 棚卸取込データが存在する場合true
   * 
   * @param array $data
   * @return bool
   */
  public function hasInventoryImport(array $data)
  {
    $data = new Collection($data);
    $inventory_month = $data->get('c_inventory_month');
    return DB::table('inventory_imports')->where('import_month', $inventory_month)->exists();
  }

  /**
   * アップロード
   *
   * @param string $path ファイルパス
   * @param array $data 条件
   */
  public function upload(string $path, array $data)
  {
    $data = new Collection($data);
    $inventory_month = $data->get('c_inventory_month');

    set_time_limit(600);

    // ファイルを読み込む
    $rows = $this->load($path);

    set_time_limit(600);

    DB::transaction(function() use ($inventory_month, $rows) {
      DB::table('inventory_imports')->where('import_month', "=", $inventory_month)->delete();

      $imports = [];
      foreach ($rows as $key => $val) {
        $imports[] = [
          'import_month' => $inventory_month,
          'item_number' => $key,
          'quantity' => $val,
          'stocks' => 0,
          'unmatch' => 1,
        ];
      }

      // 在庫を取得する
      $stocks = $this->getStocks($inventory_month);

      // 取り込んだデータと在庫をマージする
      $data = $this->mergeImportsStocks($inventory_month, $imports, $stocks);

      DB::table('inventory_imports')->insert($data);
    });
  }

  public function update(array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($data) {
      DB::table('inventory_imports')
      ->where('import_month', '=', $data->get('import_month'))
      ->where('item_number', '=', $data->get('item_number'))
        ->update([
          'quantity' => $data->get('quantity'),
          'unmatch' => $data->get('unmatch')
        ]);
    });
  }

  /**
   * PDF用のデータを取得する
   *
   * @param array $cond
   * @return array
   */
  public function getPdfData(array $cond)
  {
    $query = DB::table('inventory_imports')
    ->select([
      'inventory_imports.import_month',
      'inventory_imports.item_number',
      'inventory_imports.quantity',
      'inventory_imports.stocks',
      'items.name_jp AS item_name',
    ])
    ->leftJoin('items', 'items.item_number', '=', 'inventory_imports.item_number');
    $query = $this->setCondition($query, $cond);
    $query->orderBy('item_number');
    $data = $query->get()->toArray();

    return [
      'inventory_month' => $cond['c_inventory_month'],
      'data' => $data,
    ];
  }

  /**
   * 在庫確定
   *
   * @param array $data
   *
   */
  public function confirm(array $data)
  {
    $data = new Collection($data);
    $inventory_month = $data->get('c_inventory_month');

    DB::transaction(function() use ($inventory_month) {
      DB::table('inventories')->insertUsing([
        'import_month',
        'item_number',
        'quantity'
      ], function($query) use ($inventory_month) {
        $query->select([
          'import_month',
          'item_number',
          'quantity'
        ])
          ->from('inventory_imports')
          ->where('import_month', '=', $inventory_month);
      });

      // 現在在庫を更新する
      $this->updateDomesticStock($inventory_month);
    });
  }

  /**
   * 条件を設定する
   *
   * @param \Illuminate\Database\Eloquent\Builder $query
   * @param array $cond 条件
   * @return mixed
   */
  private function setCondition($query, array $cond)
  {
    $cond = new Collection($cond);
    $import_month = $cond->get('c_inventory_month');
    $query->where('inventory_imports.import_month', '=', $import_month);

    $c_unmatch = $cond->get('c_unmatch');
    if ($c_unmatch == 1) {
      $query->where('inventory_imports.unmatch', '=', 1);
    }

    return $query;
  }

  /**
   * ファイルを読み込む
   *
   * @param string $path ファイルパス
   * @return array
   */
  private function load(string $path)
  {
    $reader = new Xlsx();
    $reader->setReadDataOnly(true);
    $spreadsheet = $reader->load($path);
    $sheet = $spreadsheet->getSheet(0);

    $tmps = new Collection();
    foreach ($sheet->getColumnIterator() as $column) {
      foreach ($sheet->getRowIterator() as $row) {

        $item_number = $sheet->getCell($column->getColumnIndex() . $row->getRowIndex())->getValue();
        if ($item_number) {
          $tmps->push($item_number);
        }
      }
    }
    return $tmps->countBy()->all();
  }

  /**
   * 在庫を取得する
   */
  private function getStocks($inventory_month)
  {
    // 最新の棚卸データを取得する
    $latest = $this->getLatestInventories($inventory_month);

    // 入出庫データを取得する
    $moves = $this->getInventoryMoves($inventory_month);

    // 最新の棚卸データと増減をマージする
    return $this->mergeLatestMoves($inventory_month, $latest, $moves);
  }

  /**
   * 最新の棚卸データを取得
   *
   * @param string $inventory_month 棚卸年月
   * @return Collection
   */
  private function getLatestInventories($inventory_month)
  {
    $rows = DB::table('inventories')
      ->select(
        'inventories.import_month',
        'inventories.item_number',
        'inventories.quantity'
      )
      ->join(DB::raw("(SELECT b.item_number, MAX(b.import_month) AS import_month FROM inventories b WHERE b.import_month < '" . $inventory_month . "' GROUP BY b.item_number) AS x"), function ($join) {
        $join->on('x.import_month', "=", 'inventories.import_month')
          ->on('x.item_number', "=", 'inventories.item_number');
      })
      ->get();
    return $rows;
  }

  /**
   * 入出庫データを取得する
   *
   * @param string $inventory_month 棚卸年月
   * @return Collection
   */
  private function getInventoryMoves($inventory_month)
  {
    $date_from = $inventory_month . "/01";

    $dt = new Carbon($date_from);
    $date_to = $dt->addMonth()->format("Y/m/d");

    $rows = DB::table('inventory_moves')
      ->select([
        'item_number',
        'detail_kind',
        DB::raw('SUM(quantity) AS quantity')
      ])
      ->where('job_date', '>=', $date_from)
      ->where('job_date', '<', $date_to)
      ->groupBy('item_number', 'detail_kind')
      ->get();

    $data = $rows->map(function ($r) {
      $stocks = $r->quantity;
      if ($r->detail_kind === 2) {
        $stocks = $stocks * -1;
      }
      return [
        'item_number' => $r->item_number,
        'stocks' => $stocks
      ];
    });

    return $data->groupBy('item_number')->map(function($item) {
      return ['stocks' => $item->sum('stocks')];
    });
  }

  /**
   * 最新の棚卸データと増減をマージする
   *
   * @param string $import_month 棚卸年月
   * @param Collection $latest 最新の棚卸データ
   * @param Collection $moves 増減データ
   * @return Collection
   */
  private function mergeLatestMoves($import_month, $latest, $moves)
  {
    $item_numbers_latest = $latest->pluck('item_number');
    $item_numbers_moves = $moves->keys();

    $item_numbers = $item_numbers_latest->merge($item_numbers_moves)->unique()->toArray();

    $latest_groups = $latest->groupBy('item_number')->toArray();
    $moves_groups = $moves->toArray();

    $data = [];
    foreach ($item_numbers as $item_number)
    {
      $quantity_latest = 0;
      if (isset($latest_groups[$item_number])) {
        $quantity_latest = $latest_groups[$item_number][0]->quantity;
      }

      $quantity_moves = 0;
      if (isset($moves_groups[$item_number])) {
        $quantity_moves = $moves_groups[$item_number]['stocks'];
      }

      $stocks = $quantity_latest + $quantity_moves;

      $data[] = [
        'import_month' => $import_month,
        'item_number' => $item_number,
        'quantity' => 0,
        'stocks' => $stocks,
        'unmatch' => $stocks === 0 ? 0 : 1,
      ];  
    }
    return new Collection($data);
  }

  /**
   * 取り込んだデータと在庫をマージする
   *
   * @param string $import_month
   * @param array $imports
   * @param Collection $stocks
   * @return array
   */
  private function mergeImportsStocks($import_month, $imports, $stocks)
  {
    $imports = new Collection($imports);

    $item_number_imports = $imports->pluck('item_number');
    $item_number_stocks = $stocks->pluck('item_number');

    $item_number_imports_only = $item_number_imports->diff($item_number_stocks);
    $item_number_stocks_only = $item_number_stocks->diff($item_number_imports);
    $item_number_duplicates = $item_number_imports->intersect($item_number_stocks);

    $data = [];

    $imports_only = $imports->whereIn('item_number', $item_number_imports_only);
    $data = array_merge($data, $imports_only->toArray());

    $stocks_only = $stocks->whereIn('item_number', $item_number_stocks_only);
    $data = array_merge($data, $stocks_only->toArray());

    $stocks_groups = $stocks->groupBy('item_number')->toArray();

    $duplicates = $imports->whereIn('item_number', $item_number_duplicates);
    foreach ($duplicates as $row)
    {
      $item_number = $row['item_number'];
      $quantity = $row['quantity'];

      $_stocks = 0;
      if (isset($stocks_groups[$item_number])) {
        $_stocks = $stocks_groups[$item_number][0]['stocks'];
      }

      $unmatch = 1;
      if ($quantity === $_stocks) {
        $unmatch = 0;
      }

      $data[] = [
        'import_month' => $import_month,
        'item_number' => $item_number,
        'quantity' => $quantity,
        'stocks' => $_stocks,
        'unmatch' => $unmatch,
      ];
    }
    return $data;
  }

  /**
   * 現在在庫を更新する
   * 
   * @param string $inventory_month
   */
  private function updateDomesticStock($inventory_month)
  {
    $stocks = $this->getLatestStocks($inventory_month);

    Schema::create('temp_inventory', function (Blueprint $table) {
      $table->temporary();
      $table->string('item_number');
      $table->integer('stocks');
    });

    DB::table('temp_inventory')->insert($stocks);

    DB::update("UPDATE items a
      INNER JOIN temp_inventory b ON b.item_number = a.item_number
      SET a.domestic_stock = b.stocks;");

    DB::update("UPDATE items 
      SET domestic_stock = 0 
      WHERE NOT EXISTS (SELECT * FROM temp_inventory WHERE temp_inventory.item_number = items.item_number);");

    Schema::drop('temp_inventory');
  }

  /**
   * 最新の在庫を取得する
   * 
   * @param string $inventory_month
   * @return array
   */
  private function getLatestStocks($inventory_month)
  {
    // 棚卸年月のデータを取得する
    $inventories = DB::table('inventories')
      ->select([
        'item_number',
        'quantity'
      ])
      ->where('import_month', '=', $inventory_month)
      ->get();

    // 最新の入出庫データを取得する
    $moves = $this->getLatestInventoryMoves($inventory_month);

    return $this->mergeInventoriesMoves($inventories, $moves);
  }

  /**
   * 最新の入出庫データを取得する
   * 
   * @param string $inventory_month
   * @return Collection
   */
  private function getLatestInventoryMoves($inventory_month)
  {
    $date = $inventory_month . "/01";

    $dt = new Carbon($date);
    $date_from = $dt->addMonth()->format("Y/m/d");

    $rows = DB::table('inventory_moves')
      ->select([
        'item_number',
        'detail_kind',
        DB::raw('SUM(quantity) AS quantity')
      ])
      ->where('job_date', '>=', $date_from)
      ->groupBy('item_number', 'detail_kind')
      ->get();

    $data = $rows->map(function ($r) {
      $stocks = $r->quantity;
      if ($r->detail_kind === 2) {
        $stocks = $stocks * -1;
      }
      return [
        'item_number' => $r->item_number,
        'stocks' => $stocks
      ];
    });

    return $data->groupBy('item_number')->map(function($item) {
      return ['stocks' => $item->sum('stocks')];
    });
  }

  /**
   * 棚卸データと最新の入出庫データをマージする
   * 
   * @param Collection $inventories
   * @param Collection $moves
   * @return array
   */
  private function mergeInventoriesMoves($inventories, $moves)
  {
    $moves_groups = $moves->toArray();
    
    $data = [];
    foreach ($inventories as $inventory)
    {
      $item_number = $inventory->item_number;

      $quantity_moves = 0;
      if (isset($moves_groups[$item_number])) {
        $quantity_moves = $moves_groups[$item_number]['stocks'];
      }

      $stocks = $inventory->quantity + $quantity_moves;

      $data[] = [
        'item_number' => $item_number,
        'stocks' => $stocks
      ];
    }
    return $data;
  }
}
