<?php

namespace App\Base\Rules;

use Illuminate\Contracts\Validation\Rule;

class FileName implements Rule
{
  public function passes($attribute, $value)
  {
    return !preg_match('/[\\\\|\/|:|\*|\?|"|<|>|\|]/', $value);
  }

  public function message()
  {
    return 'ファイル名には次の文字は使えません。\\ / : * ? " < > |';
  }
}