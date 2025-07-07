<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\User;
use Faker\Generator as Faker;
use Illuminate\Support\Str;

$factory->define(User::class, function (Faker $faker) {
    return [
        'name' => $faker->name,
        'login_id' => Str::random(10),
        'password' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        'role' => 0,
        'deleted_at' => null
    ];
});

$factory->state(User::class, 'admin', function (Faker $faker) {
    return ['role' => 1];
});

$factory->state(User::class, 'deleted', function (Faker $faker) {
    return ['deleted_at' => $faker->dateTimeThisYear()];
});
