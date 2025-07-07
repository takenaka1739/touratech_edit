<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\Item;
use App\Base\Models\ItemClassification;
use App\Base\Models\Supplier;
use Faker\Generator as Faker;

$factory->define(Item::class, function (Faker $faker, $attributes) {
    $number = isset($attributes['item_number']) ? $attributes['item_number'] : '01-101-' . $faker->unique()->randomNumber(4) . "-0";

    return [
        'item_number' => $number,
        'name' => 'ITEM ' . $number,
        'name_jp' => '商品' . $number,
        'name_label' => '商品（ラベル）' . $number,
        'item_classification_id' => function() {
            return ItemClassification::select('id')->inRandomOrder()->first()->id;
        },
        'sales_unit_price' => $faker->numberBetween(1000, 3000),
        'purchase_unit_price' => $faker->numberBetween(1000, 3000),
        'sample_price' => $faker->numberBetween(1000, 3000),
        'supplier_id' => function() {
            return Supplier::select('id')->inRandomOrder()->first()->id;
        },
        'is_discontinued' => false,
        'discontinued_date' => null,
        'is_display' => true,
        'domestic_stock' => $faker->numberBetween(0, 200),
        'overseas_stock' => $faker->numberBetween(0, 200),
        'stock_display' => $faker->numberBetween(1, 3),
        'is_set_item' => false,
    ];
});

$factory->define(Item::class, function (Faker $faker, $attributes) {
    $number = isset($attributes['item_number']) ? $attributes['item_number'] : '02-102-' . $faker->unique()->randomNumber(4) . "-0";

    return [
        'item_number' => $number,
        'name_jp' => 'セット品 ' . $number,
        'item_classification_id' => null,
        'sales_unit_price' => $faker->numberBetween(1000, 3000),
        'purchase_unit_price' => null,
        'sample_price' => null,
        'supplier_id' => null,
        'is_discontinued' => false,
        'discontinued_date' => null,
        'is_display' => true,
        'domestic_stock' => null,
        'overseas_stock' => null,
        'stock_display' => $faker->numberBetween(1, 3),
        'is_set_item' => true,
    ];
}, 'setItem');

$factory->state(Item::class, 'discontinued', function (Faker $faker) {
    return [
        'is_discontinued' => true,
        'discontinued_date' => $faker->dateTimeThisYear(),
    ];
});

$factory->state(Item::class, 'deleted', function (Faker $faker) {
    return ['deleted_at' => $faker->dateTimeThisYear()];
});

$factory->state(Item::class, 'hidden', function (Faker $faker) {
    return ['is_display' => false];
});
