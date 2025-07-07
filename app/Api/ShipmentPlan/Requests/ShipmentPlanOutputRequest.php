<?php

namespace App\Api\ShipmentPlan\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 発送予定一覧ラベル出力バリデーション
 */
class ShipmentPlanOutputRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'selected' => 'required',
      // 'isAllSelected' => 'required|boolean',
      'c_shipment_plan_date_from' => 'required|date',
      'c_shipment_plan_date_to' => 'required|date|after_or_equal:c_shipment_plan_date_from',
      'c_item_number' => 'nullable|string',
      'isPrintPrice' => 'nullable|boolean',
    ];
  }

  public function attributes()
  {
    return [
      'selected' => '選択',
    ];
  }
}
