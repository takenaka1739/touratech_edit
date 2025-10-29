<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 旧名で参照している既存クエリを壊さないための互換ビューを作成
        // receive_orders → t_receive_orders
        DB::statement('DROP VIEW IF EXISTS t_receive_orders');
        DB::statement(<<<SQL
CREATE VIEW t_receive_orders AS
SELECT
  id,
  receive_order_date,
  delivery_date,
  customer_id,
  customer_name,
  send_flg,
  name,
  zip_code,
  address1,
  address2,
  tel,
  fax,
  corporate_class,
  user_id,
  shipping_amount,
  fee,
  discount,
  total_amount,
  order_no,
  remarks,
  rate,
  fraction,
  created_at,
  updated_at
FROM t_receive_orders
SQL);

        // receive_order_details → t_receive_order_details
        DB::statement('DROP VIEW IF EXISTS t_receive_order_details');
        DB::statement(<<<SQL
CREATE VIEW t_receive_order_details AS
SELECT
  id,
  receive_order_id,
  no,
  item_kind,
  item_id,
  item_number,
  item_name,
  item_name_jp,
  sales_unit_price,
  rate,
  fraction,
  unit_price,
  quantity,
  amount,
  sales_tax_rate,
  sales_tax,
  parent_id,
  sales_completed,
  place_completed,
  answer_date,
  created_at,
  updated_at
FROM t_receive_order_details
SQL);

        // receive_order_has_sales → t_receive_order_has_sales
        DB::statement('DROP VIEW IF EXISTS receive_order_has_sales');
        DB::statement(<<<SQL
CREATE VIEW receive_order_has_sales AS
SELECT
  receive_order_id,
  has_sales
FROM t_receive_order_has_sales
SQL);
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS receive_order_has_sales');
        DB::statement('DROP VIEW IF EXISTS receive_order_details');
        DB::statement('DROP VIEW IF EXISTS t_receive_orders');
    }
};
