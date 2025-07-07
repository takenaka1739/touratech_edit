<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\ItemClassification;
use Faker\Generator as Faker;

$factory->define(ItemClassification::class, function (Faker $faker, $attributes) {
    $id = isset($attributes['id']) ? $attributes['id'] : $faker->randomNumber(2);

    return [
        'name' => '商品分類名' . $id,
        'remarks' => $faker->text,
        'deleted_at' => null,
    ];
});

$factory->state(ItemClassification::class, 'deleted', function (Faker $faker) {
    return ['deleted_at' => $faker->dateTimeThisYear()];
});
