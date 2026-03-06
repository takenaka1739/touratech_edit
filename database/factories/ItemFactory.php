<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\Item;
use App\Base\Models\ItemClassification;
use App\Base\Models\Supplier;
use Faker\Generator as Faker;

$factory->define(Item::class, function (Faker $faker, $attributes) {
    $number = isset($attributes['item_number']) ? $attributes['item_number'] : '01-101-' . $faker->unique()->randomNumber(4) . "-0";

    return [
        'code' => 'code ' . $number,
        'item_number' => $number,
        'variations1' => 'variations1_'. $number,
        'variations2' => 'variations2_'. $number,
        'variations3' => 'variations3_'. $number,
        'variations4' => 'variations4_'. $number,
        'explanation' => 'test',
        'explanation_details' => 'explanation_details',
        'name' => 'ITEM ' . $number,
        //'name_jp' => '商品' . $number,
        'name_note' => '商品' . $number,
        'name_label' => '商品（ラベル）' . $number,
        //'category_id' => function() {
        //    return ItemClassification::select('id')->inRandomOrder()->first()->id;
        //},
        'sales_price' => $faker->numberBetween(1000, 3000),
        'sales_unit_price' => $faker->numberBetween(1000, 3000),
        'purchase_unit_price' => $faker->numberBetween(1000, 3000),
        'sample_price' => $faker->numberBetween(1000, 3000),
        'supplier_id' => function() {
            return Supplier::select('id')->inRandomOrder()->first()->id;
        },
        'number_reservations' => $faker->numberBetween(1000, 3000),
        'is_discontinued' => false,
        //'discontinued_date' => null,
        'discontinued_at' => null,
        'is_display' => true,
        'domestic_stocks' => $faker->numberBetween(0, 200),
        'overseas_stocks' => $faker->numberBetween(0, 200),
        //'stock_display' => $faker->numberBetween(1, 3),
        'display_status' => $faker->numberBetween(0, 2),
        //'is_set_item' => false,
        'is_shipping_fee' => false,
        'is_cash_delivery_fee' => false,
        'additional_shipping_fee' => $faker->numberBetween(1000, 3000),
        'shipping_pay' => $faker->numberBetween(1000, 3000),
        'is_point_rebates' => false,
        'is_payment_id1' => true,
        'is_payment_id2' => true,
        'is_payment_id3' => true,
        'is_payment_id4' => true,
        'is_payment_id5' => true,
        'is_payment_id6' => true,
    ];
});

//$factory->define(Item::class, function (Faker $faker, $attributes) {
//    $number = isset($attributes['item_number']) ? $attributes['item_number'] : '02-102-' . $faker->unique()->randomNumber(4) . "-0";
//
//    return [
//        //'item_number' => $number,
//        ////'name_jp' => 'セット品 ' . $number,
//        //'name_note' => 'セット品 ' . $number,
//        //'category_id' => null,
//        //'sales_unit_price' => $faker->numberBetween(1000, 3000),
//        //'purchase_unit_price' => null,
//        //'sample_price' => null,
//        //'supplier_id' => null,
//        //'is_discontinued' => false,
//        //'discontinued_date' => null,
//        //'is_display' => true,
//        //'domestic_stock' => null,
//        //'overseas_stock' => null,
//        ////'stock_display' => $faker->numberBetween(1, 3),
//        //'display_status' => $faker->numberBetween(0, 2),
//        //'is_set_item' => true,
//
//        'code' => 'code ' . $number,
//        'item_number' => $number,
//        'variations1' => 'variations1_'. $number,
//        'variations2' => 'variations2_'. $number,
//        'variations3' => 'variations3_'. $number,
//        'variations4' => 'variations4_'. $number,
//        'explanation' => 'test',
//        'explanation_details' => 'explanation_details',
//        'name' => 'ITEM ' . $number,
//        //'name_jp' => '商品' . $number,
//        'name_note' => '商品' . $number,
//        'name_label' => '商品（ラベル）' . $number,
//        //'category_id' => function() {
//        //    return ItemClassification::select('id')->inRandomOrder()->first()->id;
//        //},
//        'sales_price' => $faker->numberBetween(1000, 3000),
//        'sales_unit_price' => $faker->numberBetween(1000, 3000),
//        'purchase_unit_price' => $faker->numberBetween(1000, 3000),
//        'sample_price' => $faker->numberBetween(1000, 3000),
//        'supplier_id' => function() {
//            return Supplier::select('id')->inRandomOrder()->first()->id;
//        },
//        'number_reservations' => $faker->numberBetween(1000, 3000),
//        'is_discontinued' => false,
//        //'discontinued_date' => null,
//        'discontinued_at' => null,
//        'is_display' => true,
//        'domestic_stock' => $faker->numberBetween(0, 200),
//        'overseas_stock' => $faker->numberBetween(0, 200),
//        //'stock_display' => $faker->numberBetween(1, 3),
//        'display_status' => $faker->numberBetween(0, 2),
//        'is_set_item' => false,
//        'is_shipping_fee' => false,
//        'is_cash_delivery_fee' => false,
//        'additional_shipping_fee' => $faker->numberBetween(1000, 3000),
//        'shipping_pay' => $faker->numberBetween(1000, 3000),
//        'is_point_rebates' => false,
//        'is_payment_id1' => true,
//        'is_payment_id2' => true,
//        'is_payment_id3' => true,
//        'is_payment_id4' => true,
//        'is_payment_id5' => true,
//        'is_payment_id6' => true,
//    ];
//}, 'setItem');

$factory->state(Item::class, 'discontinued', function (Faker $faker) {
    return [
        'is_discontinued' => true,
        //'discontinued_date' => $faker->dateTimeThisYear(),
        'discontinued_at' => $faker->dateTimeThisYear(),
    ];
});

$factory->state(Item::class, 'deleted', function (Faker $faker) {
    return ['deleted_at' => $faker->dateTimeThisYear()];
});

$factory->state(Item::class, 'hidden', function (Faker $faker) {
    return ['is_display' => false];
});
