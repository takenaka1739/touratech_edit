<?php

namespace App\Base\Console\Services;

use Illuminate\Support\Facades\DB;

class MigrationService
{
  protected $cnn = null;

  public function __construct(string $connection_name)
  {
    $this->cnn = DB::connection($connection_name);
  }

  public function migrate()
  {
    $this->migrateDefaults('configs');
    $this->migrateDefaults('config_currencies');
    $this->migrateDefaults('users');
    $this->migrateDefaults('customers');
    $this->migrateDefaults('suppliers');
    $this->migrateDefaults('item_classifications');
    $this->migrateDefaults('items');
    $this->migrateDefaults('set_items');
    $this->migrateDefaults('set_item_details');

    $this->migrateDefaults('estimates');
    $this->migrateDefaults('estimate_details');
    $this->migrateDefaults('receive_orders');
    $this->migrateDefaults('receive_order_details');

    $this->migrateDefaults('link_estimate_receive_order');

    $this->migrateDefaults('place_orders');
    $this->migrateDefaults('place_order_details');

    // $this->migrateEstimates();
    // $this->migrateEstimateDetails();
    // $this->migrateReceiveOrders();
    // $this->migrateReceiveOrderDetails();
  }

  private function migrateDefaults(string $name)
  {
    DB::table($name)->truncate();
    $rows = $this->cnn->table($name)->get()->toArray();
    $data = [];
    $i = 0;
    foreach ($rows as $row) {
      $i++;
      if ($i > 200) {
        DB::table($name)->insert($data);

        $data = [];
        $i = 0;
      }

      $data[] = (array)$row;
    }
    DB::table($name)->insert($data);
  }

  // private function migrateEstimates()
  // {
  //   DB::table('estimates')->truncate();
  //   $rows = $this->cnn->table('estimates')->get();
  //   $data = [];
  //   foreach ($rows as $row) {

  //     if ($row->customer_id) {
  //       $customer = DB::table('customers')->find($row->customer_id);
  //       $customer_name = $customer->name;
  //     } else {
  //       $customer_name = '上様';
  //     }

  //     $data[] = [
  //       'id' => $row->id,
  //       'estimate_number' => $row->estimate_number,
  //       'estimate_date' => $row->estimate_date,
  //       'customer_id' => $row->customer_id,
  //       'customer_name' => $customer_name,
  //       'tel' => $row->tel,
  //       'fax' => $row->fax,
  //       'user_id' => $row->user_id,
  //       'delivery_customer_name' => $customer_name,
  //       'delivery_tel' => $row->tel,
  //       'delivery_fax' => $row->fax,
  //       'total_amount' => $row->total_amount,
  //       'remarks' => $row->remarks,
  //       'created_at' => $row->created_at,
  //       'updated_at' => $row->updated_at,
  //     ];
  //   }
  //   DB::table('estimates')->insert($data);
  // }

  // private function migrateEstimateDetails()
  // {
  //   DB::table('estimate_details')->truncate();
  //   $rows = $this->cnn->table('estimate_details')->get();
  //   $data = [];
  //   foreach ($rows as $row) {

  //     $item = DB::table('items')->find($row->item_id);
  //     $item_name = $item->name;
  //     $item_number = $item->item_number;
  //     $sales_unit_price = $item->sales_unit_price;

  //     $data[] = [
  //       'estimate_id' => $row->estimate_id,
  //       'id' => $row->id,
  //       'item_id' => $row->item_id,
  //       'item_number' => $item_number,
  //       'item_name' => $item_name,
  //       'sales_unit_price' => $sales_unit_price,
  //       'quantity' => $row->quantity,
  //       'amount' => $row->amount,
  //       'sales_tax' => $row->sales_tax,
  //     ];
  //   }
  //   DB::table('estimate_details')->insert($data);
  // }

  // private function migrateReceiveOrders()
  // {
  //   DB::table('receive_orders')->truncate();
  //   $rows = $this->cnn->table('receive_orders')->get();
  //   $data = [];
  //   foreach ($rows as $row) {

  //     if ($row->customer_id) {
  //       $customer = DB::table('customers')->find($row->customer_id);
  //       $customer_name = $customer->name;
  //     } else {
  //       $customer_name = '上様';
  //     }

  //     $data[] = [
  //       'id' => $row->id,
  //       'receive_order_number' => $row->receive_order_number,
  //       'receive_order_date' => $row->receive_order_date,
  //       'customer_id' => $row->customer_id,
  //       'customer_name' => $customer_name,
  //       'tel' => $row->tel,
  //       'fax' => $row->fax,
  //       'user_id' => $row->user_id,
  //       'delivery_customer_name' => $customer_name,
  //       'delivery_tel' => $row->tel,
  //       'delivery_fax' => $row->fax,
  //       'total_amount' => $row->total_amount,
  //       'remarks' => $row->remarks,
  //       'created_at' => $row->created_at,
  //       'updated_at' => $row->updated_at,
  //     ];
  //   }
  //   DB::table('receive_orders')->insert($data);
  // }

  // private function migrateReceiveOrderDetails()
  // {
  //   DB::table('receive_order_details')->truncate();
  //   $rows = $this->cnn->table('receive_order_details')->get();
  //   $data = [];
  //   foreach ($rows as $row) {

  //     $item = DB::table('items')->find($row->item_id);
  //     $item_name = $item->name;
  //     $item_number = $item->item_number;
  //     $sales_unit_price = $item->sales_unit_price;

  //     $data[] = [
  //       'receive_order_id' => $row->receive_order_id,
  //       'id' => $row->id,
  //       'item_id' => $row->item_id,
  //       'item_number' => $item_number,
  //       'item_name' => $item_name,
  //       'sales_unit_price' => $sales_unit_price,
  //       'quantity' => $row->quantity,
  //       'amount' => $row->amount,
  //       'sales_tax' => $row->sales_tax,
  //     ];
  //   }
  //   DB::table('receive_order_details')->insert($data);
  // }

}