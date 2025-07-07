<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\Customer;
use Faker\Generator as Faker;

$factory->define(Customer::class, function (Faker $faker) {
    $zip_code = $faker->postcode;
    $zip_code = substr($zip_code, 0, 3) . '-' . substr($zip_code, 3);

    return [
        'name' => $faker->company,
        'kana' => 'ホウジンカナ',
        'zip_code' => $zip_code,
        'address1' => $faker->prefecture . $faker->city,
        'address2' => $faker->streetAddress,
        'tel' => $faker->phoneNumber,
        'fax' => $faker->phoneNumber,
        'email' => $faker->safeEmail,
        'corporate_class' => $faker->numberBetween(1, 5),
        'bank_class' => $faker->numberBetween(1, 2),
        'cutoff_date' => $faker->numberBetween(20, 31),
        'rate' => $faker->numberBetween(1, 100),
        'remarks' => $faker->text,
        'deleted_at' => null,
    ];
});

$factory->define(Customer::class, function (Faker $faker) {
    $zip_code = $faker->postcode;
    $zip_code = substr($zip_code, 0, 3) . '-' . substr($zip_code, 3);

    return [
        'name' => $faker->name,
        'kana' => 'コジンカナ',
        'zip_code' => $zip_code,
        'address1' => $faker->prefecture . $faker->city,
        'address2' => $faker->streetAddress,
        'tel' => $faker->phoneNumber,
        'fax' => $faker->phoneNumber,
        'email' => $faker->safeEmail,
        'corporate_class' => $faker->numberBetween(1, 5),
        'bank_class' => $faker->numberBetween(1, 2),
        'cutoff_date' => $faker->numberBetween(20, 31),
        'rate' => $faker->numberBetween(1, 100),
        'remarks' => $faker->text,
        'deleted_at' => null,
    ];
}, 'notCorporate');

$factory->state(Customer::class, 'deleted', function (Faker $faker) {
    return ['deleted_at' => $faker->dateTimeThisYear()];
});
