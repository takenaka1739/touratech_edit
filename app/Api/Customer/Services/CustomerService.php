<?php

namespace App\Api\Customer\Services;

use App\Base\Models\Customer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 得意先マスタサービス
 */
class CustomerService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = Customer::select(
      'id',
      'name',
      'zip_code',
      'address1',
      'address2',
      'tel',
      'fax',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('name', 'asc');
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
    $query = Customer::select(
      'id',
      'name',
      'zip_code',
      'address1',
      'address2',
      'tel',
      'fax',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('name', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 得意先ID
   * @return array
   */
  public function get(int $id)
  {
    return Customer::find($id)->toArray();
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    DB::transaction(function () use ($data) {
      Customer::create($data);
    });
  }

  /**
   * 更新
   *
   * @param int $id 得意先ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($id, $data) {
      $m = Customer::find($id);
      $m->name = $data->get('name');
      $m->kana = $data->get('kana');
      $m->zip_code = $data->get('zip_code');
      $m->address1 = $data->get('address1');
      $m->address2 = $data->get('address2');
      $m->tel = $data->get('tel');
      $m->fax = $data->get('fax');
      $m->email = $data->get('email');
      $m->fraction = $data->get('fraction');
      $m->corporate_class = $data->get('corporate_class');
      $m->bank_class = $data->get('bank_class');
      $m->cutoff_date = $data->get('cutoff_date');
      $m->rate = $data->get('rate');
      $m->remarks = $data->get('remarks');
      $m->save();
    });
  }

  /**
   * 削除
   *
   * @param int $id 得意先ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      Customer::destroy($id);
    });
  }

  /**
   * 簡易登録
   *
   * @param array $data 登録データ
   */
  public function simpleStore(array $data)
  {
    return DB::transaction(function () use ($data) {
      $data = new Collection($data);
      $m = Customer::create([
        'name' => $data->get('name'),
        'kana' => $data->get('kana', ''),
        'zip_code' => $data->get('zip_code'),
        'address1' => $data->get('address1'),
        'address2' => $data->get('address2'),
        'tel' => $data->get('tel'),
        'fraction' => 3,
        'corporate_class' => $data->get('corporate_class'),
        'bank_class' => 1,
        'cutoff_date' => 31,
        'rate' => 100,
      ]);
      return $m->id;
    });
  }

  /**
   * エクセル出力用のデータを取得する
   * 
   * @param array $cond 検索条件
   * @return Collection
   */
  public function getExcelData(array $cond)
  {
    $query = Customer::select(
      'id',
      'name',
      'zip_code',
      'address1',
      'address2',
      'tel',
      'fax',
    );
    $query = $this->setCondition($query, $cond);
    return $query->get();
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
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(" ", $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('name', 'like', '%' . escape_like($key) . '%')
            ->orWhere('kana', 'like', '%' . escape_like($key) . '%')
            ->orWhere('zip_code', 'like', '%' . escape_like($key) . '%')
            ->orWhere('address1', 'like', '%' . escape_like($key) . '%')
            ->orWhere('address2', 'like', '%' . escape_like($key) . '%')
            ->orWhere('tel', 'like', '%' . escape_like($key) . '%')
            ->orWhere('fax', 'like', '%' . escape_like($key) . '%')
            ->orWhere('email', 'like', '%' . escape_like($key) . '%');
        });
      }
    }
    return $query;
  }
}