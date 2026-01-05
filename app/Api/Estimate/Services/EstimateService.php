<?php
// 更新: app/Api/Estimate/Services/EstimateService.php

namespace App\Api\Estimate\Services;

use App\Base\Models\Config;
use App\Base\Models\Item;
use App\Base\Models\Estimate;
use App\Base\Models\EstimateDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * 見積データサービス
 */
class EstimateService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $est = (new Estimate)->getTable();
    $query = Estimate::select(
      "{$est}.id",
      'estimate_date',
      'customer_name',
      'total_amount',
      'm_personnels.name AS user_name',
      DB::raw("EXISTS(SELECT * FROM t_link_estimate_receive_order x WHERE x.estimate_id = {$est}.id) AS has_receive_order")
    );
    $query = $this->setCondition($query, $cond, $est);
    $query->orderBy('estimate_date', 'desc')
      ->orderBy("{$est}.id", 'desc');
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
    $est = (new Estimate)->getTable();
    $query = Estimate::select(
      "{$est}.id",
      'estimate_date',
      'customer_name',
      'total_amount',
      'm_personnels.name AS user_name',
      DB::raw("EXISTS(SELECT * FROM t_link_estimate_receive_order x WHERE x.estimate_id = {$est}.id) AS has_receive_order")
    );
    $query = $this->setCondition($query, $cond, $est);
    $query->orderBy('estimate_date', 'desc')
      ->orderBy("{$est}.id", 'desc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $estimate_id 見積ID
   * @return array
   */
  public function get(int $estimate_id)
  {
    $est = (new Estimate)->getTable();

    $model = Estimate::select(
      "{$est}.*",
      'm_personnels.name AS user_name',
      DB::raw("EXISTS(SELECT * FROM t_link_estimate_receive_order x WHERE x.estimate_id = {$est}.id) AS has_receive_order")
    )
      ->leftJoin('m_personnels', 'm_personnels.id', '=', "{$est}.user_id")
      ->where("{$est}.id", $estimate_id)
      ->first();

    if (!$model) {
      \Log::warning('[EstimateService@get] not found', [
        'estimate_id' => $estimate_id,
        'table' => $est,
      ]);
      return [];
    }

    // ★ログ：ヘッダの値（特に estimate_date / fraction / rate / discount）
    \Log::info('[EstimateService@get] header raw', [
      'estimate_id'   => $estimate_id,
      'table'         => $est,
      'estimate_date' => $model->estimate_date, // accessor後（Y/m/d）になっているはず
      'rate'          => $model->rate,
      'fraction'      => $model->fraction,
      'discount'      => $model->discount,
      'total_amount'  => $model->total_amount,
    ]);

    $data = $model->toArray();

    $data['details'] = $this->getDetails($estimate_id);

    // ★ログ：レスポンスとして返す details の sales_tax_rate を確認
    \Log::info('[EstimateService@get] response details sales_tax_rate', [
      'estimate_id' => $estimate_id,
      'details' => collect($data['details'])->map(function ($r) {
        // $r は stdClass or array の可能性があるため吸収
        $arr = (array) $r;
        return [
          'id'            => $arr['id'] ?? null,
          'no'            => $arr['no'] ?? null,
          'item_kind'     => $arr['item_kind'] ?? null,
          'sales_tax_rate'=> $arr['sales_tax_rate'] ?? null,
          'sales_tax'     => $arr['sales_tax'] ?? null,
          'amount'        => $arr['amount'] ?? null,
          'discount'      => $arr['discount'] ?? null,
        ];
      })->toArray(),
    ]);

    return $data;
  }

  /**
   * 新規作成時のデータを作成する
   */
  public function newData()
  {
    $m = new Estimate();
    $m->estimate_date = Carbon::today()->format('Y/m/d');
    $m->shipping_amount = null;
    $m->fee = null;
    $m->total_amount = null;
    $data = $m->toArray();

    $user = Auth::user();
    $data['user_id'] = $user->id;
    $data['user_name'] = $user->name;
    $data['details'] = [];

    return $data;
  }

  /**
   * 見積と連結している受注データがある場合はtrue
   */
  public function hasReceiveOrder(int $estimate_id)
  {
    return DB::table('t_link_estimate_receive_order')
      ->where('estimate_id', $estimate_id)
      ->count() > 0;
  }

  /** 登録 */
  public function store(array $input)
  {
    // ★ログ：フロントから来た見積日・税率を確認（details の sales_tax_rate）
    \Log::info('[EstimateService@store] request header', [
      'estimate_date' => $input['estimate_date'] ?? null,
      'fraction'      => $input['fraction'] ?? null,
      'rate'          => $input['rate'] ?? null,
    ]);
    \Log::info('[EstimateService@store] request details sales_tax_rate', [
      'details' => collect($input['details'] ?? [])->map(function ($d) {
        return [
          'no'            => $d['no'] ?? null,
          'item_kind'     => $d['item_kind'] ?? null,
          'sales_tax_rate'=> $d['sales_tax_rate'] ?? null,
          'sales_tax'     => $d['sales_tax'] ?? null,
          'amount'        => $d['amount'] ?? null,
          'discount'      => $d['discount'] ?? null,
        ];
      })->toArray(),
    ]);

    $data = new Collection($input);
    return DB::transaction(function () use ($data) {
      $m = Estimate::create($data->toArray());

      // 明細を登録する
      $details = $data->get('details');
      $this->insertDetails($m->id, $details);

      return $m->id;
    });
  }

  /** 更新 */
  public function update(int $estimate_id, array $input)
  {
    // ★ログ：フロントから来た見積日・税率を確認（details の sales_tax_rate）
    \Log::info('[EstimateService@update] request header', [
      'estimate_id'   => $estimate_id,
      'estimate_date' => $input['estimate_date'] ?? null,
      'fraction'      => $input['fraction'] ?? null,
      'rate'          => $input['rate'] ?? null,
    ]);
    \Log::info('[EstimateService@update] request details sales_tax_rate', [
      'estimate_id' => $estimate_id,
      'details' => collect($input['details'] ?? [])->map(function ($d) {
        return [
          'id'            => $d['id'] ?? null,
          'no'            => $d['no'] ?? null,
          'item_kind'     => $d['item_kind'] ?? null,
          'sales_tax_rate'=> $d['sales_tax_rate'] ?? null,
          'sales_tax'     => $d['sales_tax'] ?? null,
          'amount'        => $d['amount'] ?? null,
          'discount'      => $d['discount'] ?? null,
        ];
      })->toArray(),
    ]);

    $data = new Collection($input);
    DB::transaction(function () use ($estimate_id, $data) {
      $m = Estimate::find($estimate_id);
      $m->estimate_date = $data->get('estimate_date');
      $m->delivery_date = $data->get('delivery_date');
      $m->customer_id = $data->get('customer_id');
      $m->customer_name = $data->get('customer_name');
      $m->send_flg = $data->get('send_flg');
      $m->name = $data->get('name');
      $m->zip_code = $data->get('zip_code');
      $m->address1 = $data->get('address1');
      $m->address2 = $data->get('address2');
      $m->tel = $data->get('tel');
      $m->fax = $data->get('fax');
      $m->corporate_class = $data->get('corporate_class');
      $m->user_id = $data->get('user_id');
      $m->shipping_amount = $data->get('shipping_amount');
      $m->fee = $data->get('fee');
      $m->discount = $data->get('discount');
      $m->total_amount = $data->get('total_amount');
      $m->order_no = $data->get('order_no');
      $m->remarks = $data->get('remarks');
      $m->rate = $data->get('rate');
      $m->fraction = $data->get('fraction');
      $m->save();

      // 明細を更新する
      $details = $data->get('details');
      $this->updateDetails($estimate_id, $details);
    });
  }

  /** 削除 */
  public function delete(int $estimate_id)
  {
    DB::transaction(function () use ($estimate_id) {
      Estimate::destroy($estimate_id);
    });
  }

  /** PDF用データ作成 */
  public function getPdfData(array $data)
  {
    $config = Config::getSelf();
    $data['config_data'] = $config->toArray();
    return $data;
  }

  /**
   * 条件を設定する
   *
   * @param \Illuminate\Database\Eloquent\Builder $query
   * @param array $cond
   * @param string $est 実テーブル名（t_estimates）
   */
  private function setCondition($query, array $cond, string $est)
  {
    $det = (new EstimateDetail)->getTable();

    $query->leftJoin('m_personnels', 'm_personnels.id', '=', "{$est}.user_id");

    $cond = new Collection($cond);

    $c_estimate_date_from = $cond->get('c_estimate_date_from');
    if ($c_estimate_date_from) {
      $query->where("{$est}.estimate_date", '>=', $c_estimate_date_from);
    }

    $c_estimate_date_to = $cond->get('c_estimate_date_to');
    if ($c_estimate_date_to) {
      $query->where("{$est}.estimate_date", '<=', $c_estimate_date_to);
    }

    $c_customer_name = $cond->get('c_customer_name');
    if ($c_customer_name) {
      $query->where("{$est}.customer_name", 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_user_name = $cond->get('c_user_name');
    if ($c_user_name) {
      $query->where('m_personnels.name', 'like', '%' . escape_like($c_user_name) . '%');
    }

    // ★検索（明細：品番）
    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->whereExists(function ($q) use ($c_item_number, $est, $det) {
        $q->select(DB::raw(1))
          ->from("{$det} as d")
          ->whereRaw("d.estimate_id = {$est}.id")
          ->where('d.item_number', 'like', '%' . escape_like($c_item_number) . '%');
      });
    }

    // ★検索（明細：名称）
    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name, $est, $det) {
        $q->select(DB::raw(1))
          ->from("{$det} as d")
          ->whereRaw("d.estimate_id = {$est}.id")
          ->where(function ($q) use ($c_name) {
            $q->where('d.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('d.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
          });
      });
    }

    $c_order_no = $cond->get('c_order_no');
    if ($c_order_no) {
      $query->where("{$est}.order_no", 'like', '%' . escape_like($c_order_no) . '%');
    }

    $c_not_receive_order = $cond->get('c_not_receive_order');
    if ($c_not_receive_order) {
      $query->whereNotExists(function ($q) use ($est) {
        $q->select(DB::raw(1))
          ->from('t_link_estimate_receive_order')
          ->whereRaw("t_link_estimate_receive_order.estimate_id = {$est}.id");
      });
    }

    return $query;
  }

  /**
   * 明細取得：t_estimate_details から取得（ログ付き）
   */
  private function getDetails(int $estimate_id)
  {
    $det = (new EstimateDetail)->getTable();

    $rows = DB::table($det)
      ->select("{$det}.*")
      ->where('estimate_id', $estimate_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('estimate_id')
      ->orderBy('no')
      ->get();

    \Log::info('[EstimateService@getDetails] fetched from t_estimate_details', [
      'estimate_id' => $estimate_id,
      'count' => $rows->count(),
      'details' => $rows->map(function ($r) {
        return [
          'id'            => $r->id,
          'no'            => $r->no,
          'item_kind'     => $r->item_kind,
          'sales_tax_rate'=> $r->sales_tax_rate,
          'sales_tax'     => $r->sales_tax,
          'amount'        => $r->amount,
          'discount'      => $r->discount,
        ];
      })->toArray(),
    ]);

    return $rows->toArray();
  }

  /** 明細登録・更新・削除 */
  private function insertDetails(int $estimte_id, $details)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $this->createDetailItems($estimte_id, $detail);
      }
    }
  }

  private function updateDetails(int $estimte_id, $details)
  {
    $this->deleteDetails($estimte_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        if ($id) {
          $this->updateDetailItems($id, $estimte_id, $detail);
        } else {
          $this->createDetailItems($estimte_id, $detail);
        }
      }
    }
  }

  private function createDetailItems(int $estimate_id, $detail)
  {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');
    $detail_discount = (int) ($detail->get('discount') ?? 0);

    // ★ログ：保存される sales_tax_rate を確認
    \Log::info('[EstimateService@createDetailItems] incoming', [
      'estimate_id' => $estimate_id,
      'no' => $detail->get('no'),
      'item_kind' => $item_kind,
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
      'amount' => $detail->get('amount'),
      'discount' => $detail_discount,
    ]);

    $m = EstimateDetail::create([
      'id' => null,
      'estimate_id' => $estimate_id,
      'no' => $detail->get('no'),
      'item_kind' => $item_kind,
      'item_id' => $item_id,
      'item_number' => $detail->get('item_number'),
      'item_name' => $detail->get('item_name'),
      'item_name_jp' => $detail->get('item_name_jp'),
      'sales_unit_price' => $detail->get('sales_unit_price'),
      'fraction' => $detail->get('fraction'),
      'rate' => $detail->get('rate'),
      'unit_price' => $detail->get('unit_price'),
      'quantity' => $detail->get('quantity'),
      'discount' => $detail_discount,
      'amount' => $detail->get('amount'),
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
    ]);

    if ($item_kind === 2) {
      $this->createSetItems($m);
    }
  }

  private function updateDetailItems(int $id, int $estimate_id, $detail)
  {
    $item_kind = $detail->get('item_kind');

    $m = EstimateDetail::find($id);
    $prev = clone $m;
    $detail_discount = (int) ($detail->get('discount') ?? 0);

    // ★ログ：更新される sales_tax_rate を確認
    \Log::info('[EstimateService@updateDetailItems] incoming', [
      'detail_id' => $id,
      'estimate_id' => $estimate_id,
      'no' => $detail->get('no'),
      'item_kind' => $item_kind,
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
      'amount' => $detail->get('amount'),
      'discount' => $detail_discount,
    ]);

    $m->estimate_id = $estimate_id;
    $m->no = $detail->get('no');
    $m->item_kind = $item_kind;
    $m->item_id = $detail->get('item_id');
    $m->item_number = $detail->get('item_number');
    $m->item_name = $detail->get('item_name');
    $m->item_name_jp = $detail->get('item_name_jp');
    $m->sales_unit_price = $detail->get('sales_unit_price');
    $m->fraction = $detail->get('fraction');
    $m->rate = $detail->get('rate');
    $m->unit_price = $detail->get('unit_price');
    $m->quantity = $detail->get('quantity');
    $m->discount = $detail_discount;
    $m->amount = $detail->get('amount');
    $m->sales_tax_rate = $detail->get('sales_tax_rate');
    $m->sales_tax = $detail->get('sales_tax');
    $m->save();

    if ($item_kind === 2) {
      $det = (new EstimateDetail)->getTable();

      if ($prev->item_id != $m->item_id) {
        // 商品IDが変わった場合、セット品の明細を削除し登録する
        DB::table($det)->where('parent_id', $id)->delete();
        $this->createSetItems($m);
      } else if ($prev->quantity != $m->quantity) {
        $this->updateSetItems($m);
      }
    }
  }

  private function createSetItems($parent)
  {
    $det = (new EstimateDetail)->getTable();

    $items = Item::getSetItems($parent->item_id);
    $data = [];
    foreach ($items as $item) {
      $sales_unit_price = $item->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $item->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      $data[] = [
        'id' => null,
        'estimate_id' => $parent->estimate_id,
        'no' => 0,
        'item_kind' => 3,
        'item_id' => $item->id,
        'item_number' => $item->item_number,
        'item_name' => $item->name,
        'item_name_jp' => $item->name_jp,
        'sales_unit_price' => $sales_unit_price,
        'fraction' => $parent->fraction,
        'rate' => $rate,
        'unit_price' => $unit_price,
        'quantity' => $quantity,
        'discount' => 0,
        'amount' => $amount,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => $sales_tax,
        'parent_id' => $parent->id,
      ];
    }

    // ★ログ：セット内訳に入れる税率
    \Log::info('[EstimateService@createSetItems] will insert children', [
      'estimate_id' => $parent->estimate_id,
      'parent_id' => $parent->id,
      'parent_sales_tax_rate' => $parent->sales_tax_rate,
      'children_count' => count($data),
      'table' => $det,
    ]);

    DB::table($det)->insert($data);
  }

  private function updateSetItems($parent)
  {
    $det = (new EstimateDetail)->getTable();

    $details = DB::table("{$det} as d")
      ->select([
        'd.id',
        's.set_price',
        's.quantity',
      ])
      ->join('t_set_item_details as s', 's.id', '=', 'd.item_id')
      ->where('d.parent_id', $parent->id)
      ->where('s.set_item_id', $parent->item_id)
      ->get();

    \Log::info('[EstimateService@updateSetItems] recalc children', [
      'estimate_id' => $parent->estimate_id,
      'parent_id' => $parent->id,
      'parent_sales_tax_rate' => $parent->sales_tax_rate,
      'children_count' => $details->count(),
      'table' => $det,
    ]);

    foreach ($details as $d) {
      $sales_unit_price = $d->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $d->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      DB::table($det)
        ->where('id', $d->id)
        ->update([
          'rate' => $rate,
          'unit_price' => $unit_price,
          'quantity' => $quantity,
          'discount' => 0,
          'amount' => $amount,
          'sales_tax' => $sales_tax,
        ]);
    }
  }

  private function deleteDetails(int $prev_estimate_id, $details)
  {
    $det = (new EstimateDetail)->getTable();

    $prevIds = $this->getPrevDetailIds($prev_estimate_id);
    $currentIds = Arr::pluck($details, 'id');

    $deleteIds = array_diff($prevIds, $currentIds);

    // ★ログ：削除対象ID
    \Log::info('[EstimateService@deleteDetails] diff', [
      'estimate_id' => $prev_estimate_id,
      'prev_count' => count($prevIds),
      'current_count' => count($currentIds),
      'delete_count' => count($deleteIds),
      'delete_ids' => array_values($deleteIds),
      'table' => $det,
    ]);

    if (empty($deleteIds)) {
      return;
    }

    DB::table($det)
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  private function getPrevDetailIds(int $estimate_id)
  {
    $det = (new EstimateDetail)->getTable();

    $data = DB::table($det)
      ->where('estimate_id', $estimate_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();

    return $data;
  }
}
