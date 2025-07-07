<?php

namespace App\Api\ReceiveOrderStatus\Services;

use App\Base\Models\ReceiveOrder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 受注状況一覧サービス
 */
class ReceiveOrderStatusService
{
  /**
   * 一覧データを取得する
   *
   * @param array $cond 条件
   * @return array
   */
  public function fetch(array $cond)
  {
    $rows = $this->getReceiveOrderStatus($cond);
    return [
      'rows' => $rows->toArray()
    ];
  }

  /**
   *
   * @param array $cond 条件
   * @return \Illuminate\Support\Collection
   */
  private function getReceiveOrderStatus($cond)
  {
    $query = ReceiveOrder::select(
      'r.id',
      'r.receive_order_date',
      'r.customer_name',
      'rd.id AS receive_order_detail_id',
      'rd.quantity',
      'rd.sales_completed',
      'rd.place_completed',
      'rd.answer_date',
      'rd.item_name',
      'rd.item_name_jp',
      'rd.item_kind',
      'i.item_number',
      'i.domestic_stock',
    )
    ->from('receive_orders AS r')
    ->join('receive_order_details AS rd', 'rd.receive_order_id', '=', 'r.id')
    ->join('items AS i', 'i.id', '=', 'rd.item_id')
    ->whereIn('rd.item_kind', [1, 2])
    ->where(function ($q) {
      $q->where('rd.sales_completed', '<>', 1)
        ->orWhere('rd.place_completed', '<>', 1);
    });

    $query = $this->setCondition($query, $cond);

    $rows = $query
      ->orderBy('r.receive_order_date', 'desc')
      ->orderBy('r.id')
      ->orderBy('rd.id')
      ->get();

    return $rows;
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
    $query->leftJoin('users', 'users.id', '=', 'r.user_id');

    $cond = new Collection($cond);

    $c_receive_order_date_from = $cond->get('c_receive_order_date_from');
    if ($c_receive_order_date_from) {
      $query->where('r.receive_order_date', '>=', $c_receive_order_date_from);
    }

    $c_receive_order_date_to = $cond->get('c_receive_order_date_to');
    if ($c_receive_order_date_to) {
      $query->where('r.receive_order_date', '<=', $c_receive_order_date_to);
    }

    $c_customer_name = $cond->get('c_customer_name');
    if ($c_customer_name) {
      $query->where('r.customer_name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_customer_name = $cond->get('c_user_name');
    if ($c_customer_name) {
      $query->where('users.name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->where('rd.item_number', 'like', '%' . escape_like($c_item_number) . '%');
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->where(function($q) use ($c_name) {
        $q->where('rd.item_name', 'like', '%' . escape_like($c_name) . '%')
          ->orWhere('rd.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
      });
    }

    $c_order_no = $cond->get('c_order_no');
    if ($c_order_no) {
      $query->where('r.order_no', 'like', '%' . escape_like($c_order_no) . '%');
    }

    return $query;
  }
}