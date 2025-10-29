<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * 旧 `link_estimate_receive_order` のスキーマを踏襲。
     * 実体は `t_link_estimate_receive_order`（複合PK、FKのみ）を作成し、
     * 互換用に旧名VIEWを作成します。
     *
     * 参照先は命名規則に合わせて:
     *  - estimate_id      → t_estimates(id)
     *  - receive_order_id → t_sales(id)     ※ 旧環境では receive_orders(id)
     */
    public function up(): void
    {
        Schema::create('t_link_estimate_receive_order', function (Blueprint $table) {
            $table->unsignedBigInteger('estimate_id');
            $table->unsignedBigInteger('receive_order_id');

            // 複合主キー
            $table->primary(['estimate_id', 'receive_order_id'], 'pk_t_link_estimate_receive_order');

            // （FK用の索引は自動付与されるが、名前を揃えたい場合は明示的に張る）
            $table->index('receive_order_id', 't_lero_receive_order_id_index');
        });

        // 外部キー（参照先テーブルが存在することを前提）
        Schema::table('t_link_estimate_receive_order', function (Blueprint $table) {
            // 見積 → t_estimates
            $table->foreign('estimate_id', 't_lero_estimate_id_foreign')
                  ->references('id')->on('t_estimates');

            // 受注 → t_sales（※ 旧DDLは receive_orders。新命名では t_sales を想定）
            if (Schema::hasTable('t_sales')) {
                $table->foreign('receive_order_id', 't_lero_receive_order_id_foreign')
                      ->references('id')->on('t_sales')
                      ->onDelete('cascade'); // 旧DDL準拠
            }
        });

        // 旧名互換 VIEW
        DB::statement('DROP VIEW IF EXISTS `link_estimate_receive_order`');
        DB::statement('CREATE VIEW `link_estimate_receive_order` AS SELECT * FROM `t_link_estimate_receive_order`');
    }

    public function down(): void
    {
        // 互換VIEWを先に削除
        DB::statement('DROP VIEW IF EXISTS `link_estimate_receive_order`');

        // 外部キー解除（存在しなくても続行）
        try { DB::statement('ALTER TABLE `t_link_estimate_receive_order` DROP FOREIGN KEY `t_lero_estimate_id_foreign`'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE `t_link_estimate_receive_order` DROP FOREIGN KEY `t_lero_receive_order_id_foreign`'); } catch (\Throwable $e) {}

        Schema::dropIfExists('t_link_estimate_receive_order');
    }
};
