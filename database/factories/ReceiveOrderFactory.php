<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Base\Models\Customer;
use App\Base\Models\ReceiveOrder;
use App\Base\Models\User;
use Faker\Generator as Faker;

$factory->define(ReceiveOrder::class, function (Faker $faker) {
  $zip_code = $faker->postcode;
  $zip_code = substr($zip_code, 0, 3) . '-' . substr($zip_code, 3);
  $customer = Customer::select('*')->inRandomOrder()->first();
  $user = User::select('*')->inRandomOrder()->first();

  return [
    'receive_order_date' => $faker->dateTimeThisYear(),
    'delivery_date' => $faker->dateTimeThisYear(),
    'customer_id' => $customer->id,
    'customer_name' => $customer->name,
    'zip_code' => $zip_code,
    'address1' => $faker->prefecture . $faker->city,
    'address2' => $faker->streetAddress,
    'tel' => $customer->tel,
    'fax' => $customer->fax,
    'corporate_class' => $faker->numberBetween(1, 5),
    'user_id' => $user->id,
    'shipping_amount' => $faker->numberBetween(200, 1000),
    'fee' => $faker->numberBetween(200, 1000),
    'discount' => $faker->numberBetween(200, 1000),
    'total_amount' => $faker->numberBetween(1000, 3000),
    'order_no' => $faker->randomNumber(4),
    'remarks' => $faker->text,
  ];
});
