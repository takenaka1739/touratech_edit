<?php

namespace App\Api\User\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Validation\Rule;

/**
 * 担当者マスタ更新フォームバリデーション
 */
class UserUpdateRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'name' => 'required|string|max:30',
      'login_id' => [
        'bail',
        'required',
        'string',
        'max:10',
        Rule::unique('users', 'login_id')
          ->ignore($this->id, 'id'),
      ],
      'password' => 'bail|nullable|required_if:is_update_password,true|string|max:20|ex_password',
      'is_update_password' => 'nullable|boolean',
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
      'is_update_password' => 'パスワードを変更する'
    ];
  }

  public function messages()
  {
    return [
      'password.required_if' => '変更する場合はパスワードを指定してください。'
    ];
  }
}
