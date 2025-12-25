<?php

namespace App\Api\Customer\Services;

use App\Base\Models\Customer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;   

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
    $query = Customer::selectRaw("
      id,
      name,
      zip_code,
      CONCAT(prefectures, municipality) AS address1,
      number AS address2,
      tel,
      fax
    ");
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
    $query = Customer::selectRaw("
      id,
      name,
      zip_code,
      CONCAT(prefectures, municipality) AS address1,
      number AS address2,
      tel,
      fax,
      distinguish
    ");
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
      $customer = Customer::selectRaw("
          id,
          name,
          kana,
          zip_code,
          CONCAT(prefectures, municipality) AS address1,
          number AS address2,
          prefectures,
          municipality,
          number,
          tel,
          fax,
          distinguish,
          rate,
          fraction,
          corporate_class,
          bank_class,
          cutoff_date,
          notice AS remarks,
          email_pc,
          email_phone
      ")->find($id);

      if (!$customer) {
          return [];
      }
      return $customer->toArray();
  }

  /**
   * 登録
   *
   * @param array $data 登録データ
   */
  public function store(array $data)
  {
    DB::transaction(function () use ($data) {
      $p = $data;

      $p['rank_id']      = $p['rank_id']        ?? config('const.customer.default_rank_id', 1);
      $p['distinguish']  = $p['distinguish']    ?? config('const.customer.default_distinguish', 0); // 0:個人, 1:法人 など
      $p['name']         = $p['name']           ?? '名無し';
      $p['kana']         = $p['kana']           ?? '';
      $p['nickname']     = $p['nickname']       ?? ($p['name'] ?? '');
      $p['zip_code']     = $p['zip_code']       ?? '';
      $p['prefectures']  = $p['prefectures']    ?? '';
      $p['municipality'] = $p['municipality']   ?? '';
      $p['number']       = $p['number']         ?? '';
      $p['tel']          = $p['tel']            ?? '';
      $p['gender']       = $p['gender']         ?? '不明';
      // パスワード（ハッシュ必須） 
      $p['password']     = $p['password']       ?? Hash::make(Str::random(24));
      // 既定値があるが念のため補完 
      $p['rate']         = $p['rate']           ?? 100;
      $p['fraction']     = $p['fraction']       ?? 3;
      $p['email_pc']     = $p['email_pc']       ?? '';
      $p['email_phone']     = $p['email_phone'] ?? '';

      Customer::create($p);
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
      if (!$m) {
        return;
      }

      // 基本情報
      $m->name        = $data->get('name',        $m->name);
      $m->kana        = $data->get('kana',        $m->kana);
      $m->zip_code    = $data->get('zip_code',    $m->zip_code);
      $m->tel         = $data->get('tel',         $m->tel);
      $m->fax         = $data->get('fax',         $m->fax);

      // 住所（3分割）
      // Controller 側で normalizeAddress 済みの値をそのまま使う
      $m->prefectures  = $data->get('prefectures',  $m->prefectures);
      $m->municipality = $data->get('municipality', $m->municipality);
      $m->number       = $data->get('number',       $m->number);

      // 掛率・端数処理
      if ($data->has('rate')) {
        $m->rate = (int) $data->get('rate', $m->rate);
      }
      if ($data->has('fraction')) {
        $m->fraction = (int) $data->get('fraction', $m->fraction);
      }

      // 支払方法 / 口座選択 / 締日
      if ($data->has('corporate_class')) {
        $m->corporate_class = $data->get('corporate_class', $m->corporate_class);
      }
      if ($data->has('bank_class')) {
        $m->bank_class = $data->get('bank_class', $m->bank_class);
      }
      if ($data->has('cutoff_date')) {
        $m->cutoff_date = $data->get('cutoff_date', $m->cutoff_date);
      }

      // 区分・ランク・ニックネーム・性別
      if ($data->has('distinguish')) {
        $m->distinguish = $data->get('distinguish', $m->distinguish);
      }
      if ($data->has('rank_id')) {
        $m->rank_id = $data->get('rank_id', $m->rank_id);
      }
      if ($data->has('nickname')) {
        $m->nickname = $data->get('nickname', $m->nickname);
      }
      if ($data->has('gender')) {
        $m->gender = $data->get('gender', $m->gender);
      }

      // メール（得意先マスタでは email を PC メールとして扱う想定）
      //if ($data->has('email')) {
      //  $m->email_pc = $data->get('email', $m->email_pc);
      //}
      $m->email_pc = $data->get('email_pc', $m->email_pc);
      $m->email_phone  = $data->get('email_phone', $m->email_phone );

      // 備考：リクエスト側は remarks、DB カラムは notice
      if ($data->has('remarks')) {
        $m->notice = $data->get('remarks', $m->notice);
      }

      // パスワード変更が指定されていれば反映
      if ($data->has('password') && $data->get('password')) {
        $m->password = Hash::make($data->get('password'));
      }

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
      $d = new Collection($data);

      $p = [
        'name'           => $d->get('name', '名無し'),
        'kana'           => $d->get('kana', ''),
        'nickname'       => $d->get('nickname', $d->get('name', '名無し')),
        'zip_code'       => $d->get('zip_code', ''),
        // 画面では address1/address2 を使っているケースがあるため、prefectures/municipality/number へ安全に落とす
        'prefectures'    => $d->get('prefectures', ''),
        'municipality'   => $d->get('municipality', ''),
        'number'         => $d->get('number', ''),
        'address1'       => $d->get('address1'), // テーブルには無いが Model 側で無視される想定（fillableに無ければOK）
        'address2'       => $d->get('address2'),
        'tel'            => $d->get('tel', ''),
        'fax'            => $d->get('fax'),
        'distinguish'    => $d->get('distinguish', config('const.customer.default_distinguish', 0)),
        'rank_id'        => $d->get('rank_id',   config('const.customer.default_rank_id', 1)),
        'gender'         => $d->get('gender', '不明'),
        'password'       => Hash::make($d->get('password', Str::random(24))),
        'rate'           => (int)$d->get('rate', 100),
        'fraction'       => (int)$d->get('fraction', 3),
        // NULL許容のものはそのまま
        'email_pc'       => $d->get('email_pc'),
        'email_phone'    => $d->get('email_phone'),
        'tel_phone'      => $d->get('tel_phone'),
        'birthday'       => $d->get('birthday'),
        'occupation'     => $d->get('occupation'),
        'motorcycle_maker_id1' => $d->get('motorcycle_maker_id1'),
        'motorcycle_maker_id2' => $d->get('motorcycle_maker_id2'),
        'motorcycle_maker_id3' => $d->get('motorcycle_maker_id3'),
        'workplace'             => $d->get('workplace'),
        'workplace_zip_code'    => $d->get('workplace_zip_code'),
        'workplace_prefectures' => $d->get('workplace_prefectures'),
        'workplace_municipality'=> $d->get('workplace_municipality'),
        'workplace_number'      => $d->get('workplace_number'),
        'workplace_tel'         => $d->get('workplace_tel'),
        'workplace_fax'         => $d->get('workplace_fax'),
        // bool は既定0がテーブル側にあるが、画面から指定が来たら反映
        'is_send_post_information'  => (int)$d->get('is_send_post_information', 0),
        'is_send_email_information' => (int)$d->get('is_send_email_information', 0),
        'notice'         => $d->get('notice'),
      ];

      // 最低限、NOT NULL の穴が空いていないか最終チェック（空なら空文字代入）
      foreach (['name','kana','nickname','zip_code','prefectures','municipality','number','tel','gender'] as $col) {
        if (!isset($p[$col]) || $p[$col] === null) $p[$col] = '';
      }

      $m = Customer::create($p);
      return $m->id;
    });
  }

  /**
   * エクセル出力用のデータを取得する
   *
   * @param array $cond 検索条件
   * @return \Illuminate\Support\Collection
   */
  public function getExcelData(array $cond)
  {
    $query = Customer::selectRaw("
      id,
      name,
      zip_code,
      CONCAT(prefectures, municipality) AS address1,
      number AS address2,
      tel,
      fax
    ");
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
            ->orWhereRaw("CONCAT(prefectures, municipality) LIKE ?", ['%' . escape_like($key) . '%'])
            ->orWhere('number', 'like', '%' . escape_like($key) . '%')
            ->orWhere('tel', 'like', '%' . escape_like($key) . '%')
            ->orWhere('fax', 'like', '%' . escape_like($key) . '%')
            ->orWhere('email_pc', 'like', '%' . escape_like($key) . '%')
            ->orWhere('email_phone', 'like', '%' . escape_like($key) . '%');
        });
      }
    }
    return $query;
  }
}
