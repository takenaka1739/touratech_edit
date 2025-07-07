<?php

namespace App\Api\User\Services;

use App\Base\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * 担当者マスタサービス
 */
class UserService
{
  /**
   * 検索画面用の一覧データを取得する
   *
   * @param array $cond 検索条件
   * @return array
   */
  public function dialog(array $cond)
  {
    $query = User::select(
      'id',
      'name',
    );
    $query = $this->setCondition($query, $cond);
    $query->whereIn('role', [0, 1]);
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
    $query = User::select(
      'id',
      'name',
      'login_id',
      'role',
    );
    $query = $this->setCondition($query, $cond);
    $query->orderBy('name', 'asc');
    return $query->paginate(config('const.paginate.per_page'))->toArray();
  }

  /**
   * 詳細データを取得する
   *
   * @param int $id 担当者ID
   * @return array
   */
  public function get(int $id)
  {
    return User::find($id)->toArray();
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
      User::create([
        'name' => $data->get('name'),
        'login_id' => $data->get('login_id'),
        'password' => Hash::make($data->get('password')),
        'role' => $data->get('role'),
      ]);
    });
  }

  /**
   * 更新
   *
   * @param int $id 担当者ID
   * @param array $data 更新データ
   */
  public function update(int $id, array $data)
  {
    $data = new Collection($data);

    DB::transaction(function () use ($id, $data) {
      $m = User::find($id);
      $m->name = $data->get('name');
      $m->login_id = $data->get('login_id');

      $password = $data->get('password');
      if ($password) {
        $m->password = Hash::make($password);
      }

      $m->role = $data->get('role');
      $m->save();
    });
  }

  /**
   * 削除できる場合true
   *
   * @param int $id
   * @return boolean
   */
  public function canDeleted(int $id)
  {
    if (User::find($id)->role !== User::ROLE_ADMIN) {
      return true;
    }

    return User::where('role', 1)->count() > 1;
  }

  /**
   * 削除
   *
   * @param int $id 担当者ID
   */
  public function delete(int $id)
  {
    DB::transaction(function () use ($id) {
      User::destroy($id);
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
    $c_keyword = $cond->get('c_keyword');
    if ($c_keyword !== null && $c_keyword !== '') {
      $keywords = explode(" ", $c_keyword);
      foreach ($keywords as $key) {
        $query->where(function($query) use ($key) {
          $query->where('name', 'like', '%' . escape_like($key) . '%')
            ->orWhere('login_id', 'like', '%' . escape_like($key) . '%');
        });
      }
    }

    $c_role = $cond->get('c_role');
    if ($c_role !== "none") {
      $query->where('role', intval($c_role));
    }
    return $query;
  }
}