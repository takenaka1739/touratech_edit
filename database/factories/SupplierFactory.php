<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\Supplier;
use Faker\Generator as Faker;
use Illuminate\Support\Str;

$factory->define(Supplier::class, function (Faker $faker) {
    $zip_code = $faker->postcode;
    $zip_code = substr($zip_code, 0, 3) . '-' . substr($zip_code, 3);

    return [
        'name' => $faker->company,
        'zip_code' => $zip_code,
        'address1' => $faker->prefecture . $faker->city,
        'address2' => $faker->streetAddress,
        'tel' => $faker->phoneNumber,
        'fax' => $faker->phoneNumber,
        'email' => $faker->safeEmail,
        'remarks' => $faker->text,
        'foreign_currency_type' => $faker->numberBetween(1, 3),
        'output_no' => $faker->unique()->numberBetween(2000,9999),
        'deleted_at' => null,
    ];
});

$factory->state(Supplier::class, 'deleted', function (Faker $faker) {
    return ['deleted_at' => $faker->dateTimeThisYear()];
});
