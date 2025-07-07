<?php

namespace App\Api\Estimate\Services;

use App\Base\Models\Config;
use App\Base\Models\Item;
use App\Base\Models\Estimate;
use App\Base\Models\EstimateDetail;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
    $query = Estimate::select(
      'estimates.id',
      'estimate_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
      DB::raw('EXISTS(SELECT * FROM link_estimate_receive_order x WHERE x.estimate_id = estimates.id) AS has_receive_order')
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('estimate_date', 'desc')
      ->orderBy('estimates.id', 'desc');
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
    $query = Estimate::select(
      'estimates.id',
      'estimate_date',
      'customer_name',
      'total_amount',
      'users.name AS user_name',
      DB::raw('EXISTS(SELECT * FROM link_estimate_receive_order x WHERE x.estimate_id = estimates.id) AS has_receive_order')
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('estimate_date', 'desc')
      ->orderBy('estimates.id', 'desc');
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
    $data = Estimate::select(
      'estimates.*',
      'users.name AS user_name',
      DB::raw('EXISTS(SELECT * FROM link_estimate_receive_order x WHERE x.estimate_id = estimates.id) AS has_receive_order')
    )
      ->leftJoin('users', 'users.id', '=', 'estimates.user_id')
      ->where('estimates.id', $estimate_id)
      ->first()
      ->toArray();

    $data['details'] = $this->getDetails($estimate_id);
    return $data;
  }

  /**
   * 新規作成時のデータを作成する
   *
   * @return array
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
   *
   * @param int $estimate_id
   * @return bool
   */
  public function hasReceiveOrder(int $estimate_id)
  {
    return DB::table('link_estimate_receive_order')
      ->where('estimate_id', $estimate_id)
      ->count() > 0;
  }

  /**
   * 登録
   *
   * @param array $input 登録データ
   */
  public function store(array $input)
  {
    $data = new Collection($input);
    return DB::transaction(function () use ($data) {
      $m = Estimate::create($data->toArray());

      // 明細を登録する
      $details = $data->get('details');
      $this->insertDetails($m->id, $details);

      return $m->id;
    });
  }

  /**
   * 更新
   *
   * @param int $estimate_id 見積ID
   * @param array $input 更新データ
   */
  public function update(int $estimate_id, array $input)
  {
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

  /**
   * 削除
   *
   * @param int $estimate_id 見積ID
   */
  public function delete(int $estimate_id)
  {
    DB::transaction(function () use ($estimate_id) {
      Estimate::destroy($estimate_id);
    });
  }

  /**
   * PDF用データを作成する
   *
   * @param array $data
   * @return array
   */
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
   * @param array $cond 条件
   * @return mixed
   */
  private function setCondition($query, array $cond)
  {
    $query->leftJoin('users', 'users.id', '=', 'estimates.user_id');

    $cond = new Collection($cond);

    $c_estimate_date_from = $cond->get('c_estimate_date_from');
    if ($c_estimate_date_from) {
      $query->where('estimate_date', '>=', $c_estimate_date_from);
    }

    $c_estimate_date_to = $cond->get('c_estimate_date_to');
    if ($c_estimate_date_to) {
      $query->where('estimate_date', '<=', $c_estimate_date_to);
    }

    $c_customer_name = $cond->get('c_customer_name');
    if ($c_customer_name) {
      $query->where('customer_name', 'like', '%' . escape_like($c_customer_name) . '%');
    }

    $c_user_name = $cond->get('c_user_name');
    if ($c_user_name) {
      $query->where('users.name', 'like', '%' . escape_like($c_user_name) . '%');
    }

    $c_item_number = $cond->get('c_item_number');
    if ($c_item_number) {
      $query->whereExists(function ($q) use ($c_item_number) {
        $q->select(DB::raw(1))
          ->from('estimate_details')
          ->whereRaw('estimate_details.estimate_id = estimates.id')
          ->where('estimate_details.item_number', 'like', '%' . escape_like($c_item_number) . '%');
        });
    }

    $c_name = $cond->get('c_name');
    if ($c_name) {
      $query->whereExists(function ($q) use ($c_name) {
        $q->select(DB::raw(1))
          ->from('estimate_details')
          ->whereRaw('estimate_details.estimate_id = estimates.id')
          ->where(function($q) use ($c_name) {
            $q->where('estimate_details.item_name', 'like', '%' . escape_like($c_name) . '%')
              ->orWhere('estimate_details.item_name_jp', 'like', '%' . escape_like($c_name) . '%');
          });
        });
    }

    $c_order_no = $cond->get('c_order_no');
    if ($c_order_no) {
      $query->where('order_no', 'like', '%' . escape_like($c_order_no) . '%');
    }

    $c_not_receive_order = $cond->get('c_not_receive_order');
    if ($c_not_receive_order) {
      $query->whereNotExists(function ($q) {
        $q->select(DB::raw(1))
          ->from('link_estimate_receive_order')
          ->whereRaw('link_estimate_receive_order.estimate_id = estimates.id');
      });
    }

    return $query;
  }

  /**
   * 明細を取得する
   *
   * @param int $estimate_id 見積ID
   * @return array
   */
  private function getDetails(int $estimate_id)
  {
    return DB::table('estimate_details')
      ->select(
        'estimate_details.*',
      )
      ->where('estimate_id', $estimate_id)
      ->whereIn('item_kind', [1, 2])
      ->orderBy('estimate_id')
      ->orderBy('no')
      ->get()
      ->toArray();
  }

  /**
   * 明細を登録する
   *
   * @param int $estimte_id 見積ID
   * @param mixed $details 明細データ
   */
  private function insertDetails(int $estimte_id, $details)
  {
    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);

        $this->createDetailItems($estimte_id, $detail);
      }
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $estimte_id 見積ID
   * @param mixed $details 明細データ
   */
  private function updateDetails(int $estimte_id, $details)
  {
    // 削除された明細をDBから削除する
    $this->deleteDetails($estimte_id, $details);

    if ($details) {
      foreach ($details as $detail) {
        $detail = new Collection($detail);
        $id = $detail->get('id');

        // 明細IDが存在する場合は更新、しない場合は登録する
        if ($id) {
          $this->updateDetailItems($id, $estimte_id, $detail);
        } else {
          $this->createDetailItems($estimte_id, $detail);
        }
      }
    }
  }

  /**
   * 明細を生成する
   *
   * @param int $estimate_id 見積ID
   * @param Collection $detail 明細データ
   */
  private function createDetailItems(int $estimate_id, $detail) {
    $item_kind = $detail->get('item_kind');
    $item_id = $detail->get('item_id');

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
      'amount' => $detail->get('amount'),
      'sales_tax_rate' => $detail->get('sales_tax_rate'),
      'sales_tax' => $detail->get('sales_tax'),
    ]);

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      $this->createSetItems($m);
    }
  }

  /**
   * 明細を更新する
   *
   * @param int $id 明細ID
   * @param int $estimate_id 見積ID
   * @param Collection $detail 明細データ
   */
  private function updateDetailItems(int $id, int $estimate_id, $detail) {
    $item_kind = $detail->get('item_kind');

    $m = EstimateDetail::find($id);
    $prev = clone $m;

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
    $m->amount = $detail->get('amount');
    $m->sales_tax_rate = $detail->get('sales_tax_rate');
    $m->sales_tax = $detail->get('sales_tax');
    $m->save();

    // セット品の場合、セット品の明細を登録する
    if ($item_kind === 2) {
      if ($prev->item_id != $m->item_id) {
        // 商品IDが変わった場合、セット品の明細を削除し登録する
        DB::table('estimate_details')->where('parent_id', $id)->delete();
        $this->createSetItems($m);

      } else if ($prev->quantity != $m->quantity) {
        // 数量が変わった場合、セット品の明細を更新する
        $this->updateSetItems($m);
      }
    }
  }

  /**
   * セット品の明細を生成する
   *
   * @param EstimateDetail $parent 親の明細データ
   */
  private function createSetItems($parent) {
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
        'amount' => $amount,
        'sales_tax_rate' => $parent->sales_tax_rate,
        'sales_tax' => $sales_tax,
        'parent_id' => $parent->id,
      ];
    }
    DB::table('estimate_details')->insert($data);
  }

  /**
   * セット品の明細を更新する
   *
   * @param EstimateDetail $parent 親のセット品明細データ
   */
  private function updateSetItems($parent) {
    $details = EstimateDetail::select([
      'estimate_details.id',
      'set_item_details.set_price',
      'set_item_details.quantity',
    ])
      ->join('set_item_details', 'set_item_details.id', '=', 'estimate_details.item_id')
      ->where('parent_id', $parent->id)
      ->where('set_item_id', $parent->item_id)
      ->get();

    foreach ($details as $d) {
      $sales_unit_price = $d->set_price;
      $rate = $parent->rate;
      $unit_price = calc_unit_price($sales_unit_price, $rate, $parent->fraction);
      $quantity = $d->quantity * $parent->quantity;
      [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $parent->sales_tax_rate, $parent->fraction);

      DB::table('estimate_details')
        ->where('id', $d->id)
        ->update([
          'rate' => $rate,
          'unit_price' => $unit_price,
          'quantity' => $quantity,
          'amount' => $amount,
          'sales_tax' => $sales_tax
        ]);
    }
  }

  /**
   * 削除された明細をDBから削除する
   *
   * @param int $prev_estimate_id 変更前の見積ID
   * @param mixed $details 明細データ
   */
  private function deleteDetails(int $prev_estimate_id, $details) {
    $prevIds = $this->getPrevDetailIds($prev_estimate_id);
    $currentIds = Arr::pluck($details, 'id');

    // 変更前のIDと更新されたIDの差分を取得する
    $deleteIds = array_diff($prevIds, $currentIds);

    DB::table('estimate_details')
      ->whereIn('id', $deleteIds)
      ->delete();
  }

  /**
   * 変更前の明細のIDの配列を取得する
   *
   * @param int $estimate_id 見積ID
   * @return array ex. [1, 2]
   */
  private function getPrevDetailIds(int $estimate_id) {
    $data =  DB::table('estimate_details')
      ->where('estimate_id', $estimate_id)
      ->whereIn('item_kind', [1, 2])
      ->pluck('id')
      ->toArray();
    return $data;
  }
}