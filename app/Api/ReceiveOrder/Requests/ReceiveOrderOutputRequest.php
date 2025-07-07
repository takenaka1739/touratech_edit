<?php

namespace App\Api\ReceiveOrder\Requests;

use App\Base\Http\Requests\Api\BaseRequest;
use Illuminate\Validation\Rule;

class ReceiveOrderOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'id' => 'required|integer',
      'receive_order_date' => 'required|date',
      'delivery_date' => 'nullable|date',
      'customer_id' => 'nullable|integer|exists:customers,id',
      'customer_name' => 'required|string|max:30',
      'name' => 'required|string|max:30',
      'address1' => 'required|string|max:30',
      'address2' => 'nullable|string|max:30',
      'corporate_class' => [
        'required',
        'integer',
        Rule::in([1, 2, 3, 4, 5]),
      ],
      'shipping_amount' => 'nullable|numeric|price',
      'fee' => 'nullable|numeric|price',
      'total_amount' => 'required|numeric',
      'details' => 'required',
      'details.*.no' => 'required|integer',
      'details.*.item_kind' => [
        'required',
        'integer',
        Rule::in(1, 2),
      ],
      'details.*.item_id' => 'required|integer|exists:items,id',
      'details.*.item_number' => 'nullable|string|max:50',
      'details.*.item_name' => 'nullable|string|max:400',
      'details.*.item_name_jp' => 'nullable|string|max:400',
      'details.*.sales_unit_price' => 'nullable|numeric|price',
      'details.*.rate' => 'nullable|integer|between:1,100',
      'details.*.unit_price' => 'required|numeric|price',
      'details.*.quantity' => 'required|integer|between:0,999',
      'details.*.amount' => 'nullable|numeric',
      'details.*.sales_tax' => 'nullable|numeric',
      'estimate_id' => 'nullable|integer|exists:estimates,id',
    ];
  }

  public function attributes()
  {
    return [
      'receive_order_date' => '受注日',
      'delivery_date' => '納入期日',
      'customer_id' => '得意先',
      'name' => '届け先名',
      'zip_code' => '郵便番号',
      'address1' => '住所1',
      'address2' => '住所2',
      'tel' => 'TEL',
      'fax' => 'FAX',
      'corporate_class' => '支払方法',
      'user_id' => '担当者',
      'order_no' => '注文番号',
      'shipping_amount' => '送料',
      'fee' => '代引手数料',
      'total_amount' => '合計金額',
      'remarks' => '備考',
      'details' => '明細',
    ];
  }
}
