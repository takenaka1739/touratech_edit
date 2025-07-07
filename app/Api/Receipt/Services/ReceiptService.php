<?php

namespace App\Api\Receipt\Services;

use App\Base\Models\Customer;
use App\Base\Models\Invoice;
use App\Base\Models\Receipt;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

/**
 * 入金データサービス
 */
class ReceiptService
{
  /**
   * 一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function fetch(array $cond)
  {
    $query = Receipt::select(
      'receipts.id',
      'receipt_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('receipt_date', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $receipt_id 入金ID
   * @return array
   */
  public function get(int $receipt_id)
  {
    $data = Receipt::select(
      'receipts.*',
      'users.name AS user_name',
    )
      ->leftJoin('users', 'users.id', '=', 'receipts.user_id')
      ->where('receipts.id', $receipt_id)
      ->first();

    $customer_id = $data->customer_id;
    $data = $data->toArray();

    if ($customer_id) {
      $row = $this->getCustomer($customer_id);
      $data['last_month_sales'] = $row['last_month_sales'];
      $data['accounts_receivable'] = $row['accounts_receivable'];
    }

    return $data;
  }

  /**
   * 売上と連結している請求データがある場合はtrue
   *
   * @param int $receipt_id 入金ID
   * @return bool
   */
  public function hasInvoice(int $receipt_id)
  {
    return DB::table('link_receipt_invoice')
      ->where('receipt_id', $receipt_id)
      ->count() > 0;
  }

  /**
   * 新規作成時のデータを作成する
   *
   * @return array
   */
  public function newData()
  {
    $m = new Receipt();
    $m->receipt_date = Carbon::today()->format('Y/m/d');
    $m->total_amount = null;
    $data = $m->toArray();

    $user = Auth::user();
    $data['user_id'] = $user->id;
    $data['user_name'] = $user->name;

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
      $m = Receipt::create($data->toArray());
      $m->save();
    });
  }

  /**
   * 更新
   *
   * @param int $receipt_id 入金ID
   * @param array $data 更新データ
   */
  public function update(int $receipt_id, array $data)
  {
    $data = new Collection($data);

    DB::transaction(function () use ($receipt_id, $data) {
      $m = Receipt::find($receipt_id);
      $m->receipt_date = $data->get('receipt_date');
      $m->user_id = $data->get('user_id');
      $m->delivery_day = $data->get('delivery_day');
      $m->total_amount = $data->get('total_amount');
      $m->remarks = $data->get('remarks');
      $m->save();
    });
  }

  /**
   * 削除
   *
   * @param int $receipt_id 入金ID
   */
  public function delete(int $receipt_id)
  {
    DB::transaction(function () use ($receipt_id) {
      Receipt::destroy($receipt_id);
    });
  }

  /**
   * 得意先を取得する
   * 前月売上額、売掛金残高も取得する
   *
   * @param int $customer_id
   * @return array
   */
  public function getCustomer(int $customer_id)
  {
    $row = Customer::select([
        'customers.id',
        'customers.name',
        'invoices.total_amount',
        'invoices.total_tax',
        'invoices.total_invoice',
      ])
      ->where('customers.id', '=', $customer_id)
      ->leftJoin('invoices', 'invoices.customer_id', '=', 'customers.id')
      ->orderBy('invoices.invoice_month', 'DESC')
      ->first();

    return [
      'id' => $row->id,
      'name' => $row->name,
      'last_month_sales' => ($row->total_amount ?? 0) + ($row->total_tax ?? 0),
      'accounts_receivable' => ($row->total_invoice ?? 0),
    ];
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
    $query->leftJoin('users', 'users.id', '=', 'receipts.user_id');

    $cond = new Collection($cond);

    $c_receipt_date_from = $cond->get('c_receipt_date_from');
    if ($c_receipt_date_from) {
      $query->where('receipt_date', '>=', $c_receipt_date_from);
    }

    $c_receipt_date_to = $cond->get('c_receipt_date_to');
    if ($c_receipt_date_to) {
      $query->where('receipt_date', '<=', $c_receipt_date_to);
    }

    $c_customer_name = $cond->get('c_customer_name');
    if ($c_customer_name) {
      $query->where('customer_name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_customer_name = $cond->get('c_user_name');
    if ($c_customer_name) {
      $query->where('users.name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    return $query;
  }
}