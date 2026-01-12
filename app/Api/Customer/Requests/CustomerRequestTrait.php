<?php

namespace App\Api\Customer\Requests;

use Illuminate\Validation\Rule;

/**
 * 得意先マスタ共通フォームバリデーション
 */
trait CustomerRequestTrait
{
  public function commonRules()
  {
    return [
      'name'        => 'required|string|max:30',
      'kana'        => 'required|string|max:30',
      'zip_code'    => 'required|zip_code',
      'distinguish' => 'required|numeric|price',

      // ▼ DBの定義に合わせて長さを調整
      //   t_customers.prefectures: varchar(8) NOT NULL
      //   t_customers.municipality: varchar(100) NOT NULL
      //   t_customers.number: varchar(30) NOT NULL
      //
      //   住所1 / 住所2 UI とのズレの都合上、
      //   ひとまず「nullable」でバリデーションは通すようにしておく。
      'prefectures'  => 'nullable|string|max:8',
      'municipality' => 'nullable|string|max:100',
      'number'       => 'nullable|string|max:30',

      'tel'      => 'required|tel',
      'fax'      => 'nullable|tel',
      //'email'    => 'bail|nullable|string|email:rfc|max:128',
      'email_main'    => 'bail|required|string|email:rfc|max:128',
      'email_sub'    => 'bail|nullable|string|email:rfc|max:128',
      'fraction' => [
        'required',
        'integer',
        Rule::in([1, 2, 3]),
      ],
      'corporate_class' => [
        'required',
        'integer',
        Rule::in([1, 2, 3, 4, 5]),
      ],
      'bank_class' => [
        'required',
        'integer',
        Rule::in([1, 2]),
      ],
      'cutoff_date' => 'required|digits_between:1,31',
      'rate'        => 'required|digits_between:1,100',
      'remarks'     => 'nullable|string|max:200',
    ];
  }

  public function attributes()
  {
    return [
      'name'           => '得意先名',
      'distinguish'    => '区分',
      'kana'           => 'カナ',
      'zip_code'       => '郵便番号',
      'prefectures'    => '都道府県',
      'municipality'   => '市区町村',
      'number'         => '建物名・番地',
      'tel'            => 'TEL',
      'fax'            => 'FAX',
      //'email'        => 'MAIL',
      'email_main'     => 'MAIL（MAIN）',
      'email_sub'      => 'MAIL（SUB）',
      'fraction'       => '端数処理',
      'corporate_class'=> '支払方法',
      'bank_class'     => '口座選択',
      'cutoff_date'    => '締日',
      'rate'           => '掛率',
      'remarks'        => '備考',
    ];
  }
}
