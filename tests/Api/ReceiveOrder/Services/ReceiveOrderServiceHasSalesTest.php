<?php

namespace Tests\Api\ReceiveOrder\Services;

use App\Base\Models\ReceiveOrder;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use Tests\TestCase;
use Illuminate\Support\Facades\Log;

class ReceiveOrderServiceHasSalesTest extends TestCase
{

  protected function setUp(): void
  {
    parent::setUp();

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    DB::table('receive_order_details')->delete();
    DB::table('receive_orders')->delete();

    DB::table('receive_orders')->insert([
      [
        "id" => 2,
        "receive_order_date" => "2021/08/22",
        "tel" => "000-0000-0002",
        "corporate_class" => 1,
        "total_amount" => 101,
      ],
      [
        "id" => 3,
        "receive_order_date" => "2021/08/23",
        "tel" => "000-0000-0003",
        "corporate_class" => 1,
        "total_amount" => 102,
      ],
      [
        "id" => 4,
        "receive_order_date" => "2021/08/24",
        "tel" => "000-0000-0004",
        "corporate_class" => 1,
        "total_amount" => 103,
      ],
    ]);
  }

  public function testSuccess()
  {
    $rows = ReceiveOrder::select(
      'receive_orders.id',
    );


  }
}
