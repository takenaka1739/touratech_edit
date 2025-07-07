<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\EstimateDetail;
use App\Base\Models\Item;
use Faker\Generator as Faker;
use Illuminate\Support\Str;

$factory->define(EstimateDetail::class, function (Faker $faker) {
  $item = Item::select('*')->inRandomOrder()->first();

  $sales_unit_price = $item->sales_unit_price;
  $rate = $faker->numberBetween(90, 100);
  $unit_price = ($sales_unit_price ?? 1000) * $rate / 100;
  $quantity = $faker->randomNumber(2);
  $amount = ceil($unit_price * $quantity);
  $sales_tax = ceil(($amount * 0.1 / (1.1)) * 100) / 100;

  return [
    'item_kind' => $item->is_set_item ? 2 : 1,
    'item_id' => $item->id,
    'item_number' => $item->item_number,
    'item_name' => $item->name,
    'item_name_jp' => $item->name_jp,
    'sales_unit_price' => $sales_unit_price,
    'rate' => $rate,
    'fraction' => $faker->numberBetween(1, 3),
    'unit_price' => $unit_price,
    'quantity' => $quantity,
    'amount' => $amount,
    'sales_tax_rate' => 10,
    'sales_tax' => $sales_tax,
  ];
});
