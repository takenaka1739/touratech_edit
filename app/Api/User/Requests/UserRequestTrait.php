<?php

namespace App\Api\User\Requests;

/**
 * 担当者マスタ共通フォームバリデーション
 */
trait UserRequestTrait
{
  public function commonRules()
  {
    return [
      'name' => 'required|string|max:30',
      'login_id' => 'bail|required|string|max:10|unique:users',
      'password' => 'bail|required|string|max:20|ex_password',
      'role' => 'required|integer',
    ];
  }

  public function attributes()
  {
    return [
      'name' => '担当者名',
      'login_id' => 'ID',
      'password' => 'パスワード',
      'role' => '権限',
    ];
  }
}