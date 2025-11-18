<?php

namespace App\Api\SetItem\Services;

use App\Base\Models\Item;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * セット品マスタサービス
 */
class SetItemService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = Item::select(
      'm_items.item_number',
      'm_items.id',
      //'m_items.name_jp',
      'm_items.name_note',
      'm_items.sales_unit_price',
      't_set_items.total_quantity',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('item_number', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
    \Log::debug('fetch');
    $query = Item::select(
      'm_items.item_number',
      'm_items.id',
      'm_items.name_note',
      'm_items.sales_unit_price',
      't_set_items.total_quantity',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('item_number', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id セット品ID
   * @return array
   */
  public function get(int $id)
  {
    \Log::debug('get');
    $data = Item::select(
      //'m_items.id',
      //'m_items.item_number',
      ////'items.name_jp',
      //'m_items.name_note',
      //'m_items.sales_unit_price',
      ////'items.discontinued_date',
      //'m_items.discontinued_at',
      //'m_items.is_display',

      'm_items.id',
      'm_items.supplier_id',
      'm_items.code',
      'm_items.name',
      'm_items.item_number',
      'm_items.variations1',
      'm_items.variations2',
      'm_items.variations3',
      'm_items.variations4',
      'm_items.explanation',
      'm_items.explanation_details',
      'm_items.name_note',
      'm_items.name_label',
      'm_items.is_sell',
      'm_items.purchase_price',
      'm_items.sales_price',
      'm_items.sales_unit_price',
      'm_items.purchase_unit_price',
      'm_items.sample_price',
      'm_items.is_discontinued',
      'm_items.discontinued_at',
      'm_items.is_display',
      'm_items.domestic_stocks',
      'm_items.overseas_stocks',
      'm_items.display_status',
      'm_items.remarks',
      'm_items.number_reservations',
      'm_items.is_shipping_fee',
      'm_items.shipping_pay',
      'm_items.is_cash_delivery_fee',
      'm_items.additional_shipping_fee',
      'm_items.is_point_rebates',
      'm_items.is_payment_id1',
      'm_items.is_payment_id2',
      'm_items.is_payment_id3',
      'm_items.is_payment_id4',
      'm_items.is_payment_id5',
      'm_items.is_set_item',
    )
      ->where('m_items.id', $id)
      ->first()
      ->toArray();

    $data['details'] = $this->getDetails($id);
    return $data;
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($data) {
      $m = Item::make($data->toArray());
      //$m->is_discontinued = $data->has('discontinued_date');
      //$m->discontinued_at = $data->has('discontinued_at');
      //$m->discontinued_at = $data->has('discontinued_at')
      //    ? $data->get('discontinued_at')
      //    : null;
      //$m->supplier_id = 0;
//
      //$m->is_set_item = true;
      $m->supplier_id             = $data->has('supplier_id') ? $data->get('supplier_id') : 1;
      $m->code                    = $data->has('code') ? $data->get('code') : 0;
      $m->name                    = $data->has('name') ? $data->get('name') : 'non';
      $m->item_number             = $data->has('item_number') ? $data->get('item_number') : 0;
      $m->variations1             = $data->has('variations1') ? $data->get('variations1') : null;
      $m->variations2             = $data->has('variations2') ? $data->get('variations2') : null;
      $m->variations3             = $data->has('variations3') ? $data->get('variations3') : null;
      $m->variations4             = $data->has('variations4') ? $data->get('variations4') : null;
      $m->explanation             = $data->has('explanation') ? $data->get('explanation') : null;
      $m->explanation_details     = $data->has('explanation_details') ? $data->get('explanation_details') : null;
      $m->name_note               = $data->has('name_note') ? $data->get('name_note') : 'non';
      $m->name_label              = $data->has('name_label') ? $data->get('name_label') : 'non';
      $m->is_sell                 = $data->has('is_sell') ? $data->get('is_sell') : false;
      $m->purchase_price          = $data->has('purchase_price') ? $data->get('purchase_price') : null;
      $m->sales_price             = $data->has('sales_price') ? $data->get('sales_price') : 0;
      $m->sales_unit_price        = $data->has('sales_unit_price') ? $data->get('sales_unit_price') : null;
      $m->purchase_unit_price     = $data->has('purchase_unit_price') ? $data->get('purchase_unit_price') : null;
      $m->sample_price            = $data->has('sample_price') ? $data->get('sample_price') : null;
      $m->is_discontinued         = $data->has('is_discontinued') ? $data->get('is_discontinued') : false;
      $m->discontinued_at         = $data->has('discontinued_at') ? $data->get('discontinued_at') : null;
      $m->is_display              = $data->has('is_display') ? $data->get('is_display') : false;
      $m->domestic_stocks         = $data->has('domestic_stocks') ? $data->get('domestic_stocks') : 0;
      $m->overseas_stocks         = $data->has('overseas_stocks') ? $data->get('overseas_stocks') : 0;
      $m->display_status          = $data->has('display_status') ? $data->get('display_status') : 1;
      $m->remarks                 = $data->has('remarks') ? $data->get('remarks') : null;
      $m->number_reservations     = $data->has('number_reservations') ? $data->get('number_reservations') : null;
      $m->is_shipping_fee         = $data->has('is_shipping_fee') ? $data->get('is_shipping_fee') : false;
      $m->shipping_pay            = $data->has('shipping_pay') ? $data->get('shipping_pay') : null;
      $m->is_cash_delivery_fee    = $data->has('is_cash_delivery_fee') ? $data->get('is_cash_delivery_fee') : false;
      $m->additional_shipping_fee = $data->has('additional_shipping_fee') ? $data->get('additional_shipping_fee') : 0;
      $m->is_point_rebates        = $data->has('is_point_rebates') ? $data->get('is_point_rebates') : false;
      $m->is_payment_id1          = $data->has('is_payment_id1') ? $data->get('is_payment_id1') : false;
      $m->is_payment_id2          = $data->has('is_payment_id2') ? $data->get('is_payment_id2') : false;
      $m->is_payment_id3          = $data->has('is_payment_id3') ? $data->get('is_payment_id3') : false;
      $m->is_payment_id4          = $data->has('is_payment_id4') ? $data->get('is_payment_id4') : false;
      $m->is_payment_id5          = $data->has('is_payment_id5') ? $data->get('is_payment_id5') : false;
      $m->is_set_item             = $data->has('is_set_item') ? $data->get('is_set_item') : true;

      $m->save();

      $details = $data->get('details');
      $this->saveDetails($m->id, $details);
    });
  }

  /**
   * 更新
   *
   * @param int $id セット品ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = Item::find($id);
      //$m->item_number = $data->get('item_number');
      //$m->name_note = $data->get('name_note');
      //$m->sales_unit_price = $data->get('sales_unit_price');
      //$discontinued_at = $data->get('discontinued_at');
      ////$m->is_discontinued = $discontinued_at ? true : false;
      //$m->is_discontinued = $data->get('is_discontinued');
      ////$m->discontinued_date = $discontinued_date;
      //$m->is_display = $data->get('is_display');
      $m->supplier_id             = $data->has('supplier_id') ? $data->get('supplier_id') : 1;
      $m->code                    = $data->has('code') ? $data->get('code') : 0;
      $m->name                    = $data->has('name') ? $data->get('name') : 'non';
      $m->item_number             = $data->has('item_number') ? $data->get('item_number') : 0;
      $m->variations1             = $data->has('variations1') ? $data->get('variations1') : null;
      $m->variations2             = $data->has('variations2') ? $data->get('variations2') : null;
      $m->variations3             = $data->has('variations3') ? $data->get('variations3') : null;
      $m->variations4             = $data->has('variations4') ? $data->get('variations4') : null;
      $m->explanation             = $data->has('explanation') ? $data->get('explanation') : null;
      $m->explanation_details     = $data->has('explanation_details') ? $data->get('explanation_details') : null;
      $m->name_note               = $data->has('name_note') ? $data->get('name_note') : 'non';
      $m->name_label              = $data->has('name_label') ? $data->get('name_label') : 'non';
      $m->is_sell                 = $data->has('is_sell') ? $data->get('is_sell') : false;
      $m->purchase_price          = $data->has('purchase_price') ? $data->get('purchase_price') : null;
      $m->sales_price             = $data->has('sales_price') ? $data->get('sales_price') : 0;
      $m->sales_unit_price        = $data->has('sales_unit_price') ? $data->get('sales_unit_price') : null;
      $m->purchase_unit_price     = $data->has('purchase_unit_price') ? $data->get('purchase_unit_price') : null;
      $m->sample_price            = $data->has('sample_price') ? $data->get('sample_price') : null;
      $m->is_discontinued         = $data->has('is_discontinued') ? $data->get('is_discontinued') : false;
      $m->discontinued_at         = $data->has('discontinued_at') ? $data->get('discontinued_at') : null;
      $m->is_display              = $data->has('is_display') ? $data->get('is_display') : false;
      $m->domestic_stocks         = $data->has('domestic_stocks') ? $data->get('domestic_stocks') : 0;
      $m->overseas_stocks         = $data->has('overseas_stocks') ? $data->get('overseas_stocks') : 0;
      $m->display_status          = $data->has('display_status') ? $data->get('display_status') : 1;
      $m->remarks                 = $data->has('remarks') ? $data->get('remarks') : null;
      $m->number_reservations     = $data->has('number_reservations') ? $data->get('number_reservations') : null;
      $m->is_shipping_fee         = $data->has('is_shipping_fee') ? $data->get('is_shipping_fee') : false;
      $m->shipping_pay            = $data->has('shipping_pay') ? $data->get('shipping_pay') : null;
      $m->is_cash_delivery_fee    = $data->has('is_cash_delivery_fee') ? $data->get('is_cash_delivery_fee') : false;
      $m->additional_shipping_fee = $data->has('additional_shipping_fee') ? $data->get('additional_shipping_fee') : 0;
      $m->is_point_rebates        = $data->has('is_point_rebates') ? $data->get('is_point_rebates') : false;
      $m->is_payment_id1          = $data->has('is_payment_id1') ? $data->get('is_payment_id1') : false;
      $m->is_payment_id2          = $data->has('is_payment_id2') ? $data->get('is_payment_id2') : false;
      $m->is_payment_id3          = $data->has('is_payment_id3') ? $data->get('is_payment_id3') : false;
      $m->is_payment_id4          = $data->has('is_payment_id4') ? $data->get('is_payment_id4') : false;
      $m->is_payment_id5          = $data->has('is_payment_id5') ? $data->get('is_payment_id5') : false;
      $m->is_set_item             = $data->has('is_set_item') ? $data->get('is_set_item') : true;

      $m->save();

      $details = $data->get('details');
      $this->saveDetails($id, $details);
    });
  }

  /**
   * 削除
   *
   * @param int $id セット品ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      Item::destroy($id);
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
    $query->leftJoin('t_set_items', 't_set_items.set_item_id', '=', 'm_items.id');
    //$query->leftJoin('t_set_items', 't_set_items.item_id', '=', 'm_items.id');

    $cond = new Collection($cond);
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(" ", $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('item_number', 'like', '%' . escape_like($key) . '%')
            //->orWhere('name_jp', 'like', '%' . escape_like($key) . '%');
            ->orWhere('name_note', 'like', '%' . escape_like($key) . '%');
        });
      }
    }

    $is_set_item = $cond->get('c_is_set_item');
    if (!is_null($is_set_item)) {
      $query->where('is_set_item', $is_set_item);
    }

    $c_is_display = $cond->get('c_is_display');
    if ($c_is_display !== "none") {
      $query->where('is_display', $c_is_display === "1");
    }

    $has_discontinued = $cond->get('c_has_discontinued');
    if (!$has_discontinued) {
      //$query->whereNull('discontinued_date');
      $query->whereNull('discontinued_at');
    }

    return $query;
  }

  /**
   * 明細データを取得する
   *
   * @param int $id セット品ID
   * @return array
   */
  private function getDetails(int $id)
  {
    return DB::table('t_set_item_details')
      ->join('m_items', 'm_items.id', '=', 't_set_item_details.item_id')
      ->select(
        't_set_item_details.*',
        'm_items.name AS item_name',
        //'items.name_jp AS item_name_jp',
        'm_items.name_note AS item_name_note',
        'm_items.item_number',
        'm_items.sales_unit_price'
        )
      ->where('set_item_id', $id)
      ->get()
      ->toArray();
  }

  /**
   * 明細を保存する
   *
   * @param int $id セット品ID
   * @param mixed $details 明細データ
   */
  private function saveDetails(int $id, $details)
  {
    DB::table('t_set_items')->where('set_item_id', '=', $id)->delete();
    DB::table('t_set_item_details')->where('set_item_id', '=', $id)->delete();

    $total_quantity = 0;
    if ($details) {
      $data = [];
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $data[] = [
          'set_item_id' => $id,
          'id' => $detail->get('id'),
          'item_id' => $detail->get('item_id'),
          'quantity' => $detail->get('quantity'),
          'set_price' => $detail->get('set_price'),
        ];
        $total_quantity += (int)$detail->get('quantity');
      }
      DB::table('t_set_item_details')->insert($data);
    }
    DB::table('t_set_items')->insert([[
      'set_item_id' => $id,
      'total_quantity' => $total_quantity,
    ]]);
  }
}