<?php

namespace App\Api\ShipmentPlanImport\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use XBase\TableReader;

/**
 * 発送予定取込サービス
 */
class ShipmentPlanImportService
{
  /**
   * 取込
   *
   * @param string $path ファイルパス
   * @param array $data 条件
   */
  public function upload(string $path, array $data)
  {
    $data = new Collection($data);
    $c_arrival_date = $data->get('c_arrival_date');

    $rows = [];

    $table = new TableReader($path, [
      'columns' => [
        'part',
        'name',
        'price',
        'quantity',
        'total',
        'name',
      ],
      'encoding' => 'cp1251',
    ]);
    while ($record = $table->nextRecord()) {
      $rows[] = [
        'shipment_plan_date' => $c_arrival_date,
        'item_number' => $record->part,
        'name' => $record->name,
        'unit_price' => $record->price,
        'quantity' => $record->quantity,
        'amount' => $record->total,
        'place_order_no' => $this->getPlaceOrderNo($record->name),
      ];
    }

    DB::transaction(function() use ($c_arrival_date, $rows) {
      DB::table('shipment_plans')
        ->where('shipment_plan_date', '=', $c_arrival_date)
        ->delete();

      DB::table('shipment_plans')->insert($rows);
    });
  }

  /**
   * 発注出力ファイル名を取得する
   *
   * @param string $text 文字列
   * @return string|null
   */
  private function getPlaceOrderNo($text)
  {
    if (preg_match('/.*(Order_1802351_.+\.csv).*/im', $text, $matches)) {
      return $matches[1];
    }

    return null;
  }
}
