<?php

namespace App\Api\ShipmentPlan\Requests;

use App\Base\Http\Requests\Api\BaseRequest;

/**
 * 発送予定一覧一括仕入バリデーション
 */
class ShipmentPlanBulkPurchaseRequest extends BaseRequest
{
  public function rules()
  {
    return [
      'selected' => 'required',
      'c_shipment_plan_date_from' => 'required|date',
      'c_shipment_plan_date_to' => 'required|date|after_or_equal:c_shipment_plan_date_from',
    ];
  }

  public function attributes()
  {
    return [
      'selected' => '選択',
      'c_shipment_plan_date_from' => '到着予定日From',
      'c_shipment_plan_date_to' => '到着予定日To',
    ];
  }
}
