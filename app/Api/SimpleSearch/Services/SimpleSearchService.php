<?php

namespace App\Api\SimpleSearch\Services;

use App\Base\Models\Item;
use Illuminate\Support\Collection;

class SimpleSearchService
{
  public function get(array $input)
  {
    $input = new Collection($input);
    $item_number = $input->get('c_item_number');

    return Item::select([
      'item_number',
      'name_jp',
      'sales_unit_price',
      'domestic_stock',
      'overseas_stock',
    ])
      ->where('item_number', '=', $item_number)
      ->first();
  }
}