<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 受注リンクのFK: t_sales → t_receive_orders へ付け替え
        // 既存FK名はエラーログの通り: t_lero_receive_order_id_foreign
        DB::statement("ALTER TABLE t_link_estimate_receive_order DROP FOREIGN KEY t_lero_receive_order_id_foreign");
        DB::statement("ALTER TABLE t_link_estimate_receive_order
            ADD CONSTRAINT t_lero_receive_order_id_foreign
            FOREIGN KEY (receive_order_id)
            REFERENCES t_receive_orders(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        ");
    }

    public function down(): void
    {
        // 元に戻す（誤っていた状態）
        DB::statement("ALTER TABLE t_link_estimate_receive_order DROP FOREIGN KEY t_lero_receive_order_id_foreign");
        DB::statement("ALTER TABLE t_link_estimate_receive_order
            ADD CONSTRAINT t_lero_receive_order_id_foreign
            FOREIGN KEY (receive_order_id)
            REFERENCES t_sales(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        ");
    }
};
