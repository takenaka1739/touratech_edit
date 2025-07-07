<?php

namespace App\Api\SimpleSearch\Controllers;

use App\Base\Http\Controllers\Api\BaseController;

use App\Api\SimpleSearch\Services\SimpleSearchService;
use App\Api\SimpleSearch\Requests\SimpleSearchGetRequest;

class SimpleSearchController extends BaseController
{
  /** @var \App\Api\SimpleSearch\Services\SimpleSearchService */
  protected $service;

  /**
   * コンストラクタ
   */
  public function __construct(SimpleSearchService $service)
  {
    $this->service = $service;
  }

  /**
   *
   */
  public function get(SimpleSearchGetRequest $request)
  {
    $data = $this->service->get($request->validated());

    if ($data) {
      return $this->success($data->toArray());
    } else {
      return $this->error("", [
        "c_item_number" => "指定された品番は存在しません",
      ]);
    }
  }
}