<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * 旧 `set_item_details` を踏襲しつつ、
     * 実体テーブルを `t_set_item_details`（複合PK）として作成。
     * 互換用に旧名 VIEW も併設します。
     *
     * ポイント：
     * - PKは (set_item_id, id) の複合主キー（id は“子アイテムID”を指す）
     * - 外部キーは両方とも m_items(id) を参照（旧DDL準拠）
     */
    public function up(): void
    {
        Schema::create('t_set_item_details', function (Blueprint $table) {
            // 複合PKの各構成カラム
            $table->unsignedBigInteger('set_item_id');   // セット親（= m_items.id）
            $table->unsignedBigInteger('id');            // 構成子（= m_items.id）

            // 構成情報
            $table->unsignedBigInteger('item_id');       // 明示子（= m_items.id、利便用。旧DDLに準拠して NOT NULL）
            $table->integer('quantity');                 // NOT NULL
            $table->decimal('set_price', 10, 2);         // NOT NULL

            // インデックス / 主キー
            $table->primary(['set_item_id', 'id'], 'pk_t_set_item_details');
            $table->index('item_id', 't_set_item_details_item_id_index');
        });

        // 外部キー（参照先テーブルが存在する前提）
        Schema::table('t_set_item_details', function (Blueprint $table) {
            // 旧DDL準拠：両方 m_items(id) を参照
            if (Schema::hasTable('m_items')) {
                $table->foreign('item_id', 't_set_item_details_item_id_foreign')
                      ->references('id')->on('m_items');

                $table->foreign('set_item_id', 't_set_item_details_set_item_id_foreign')
                      ->references('id')->on('m_items');
            }
        });

        // 旧名互換 VIEW
        DB::statement('DROP VIEW IF EXISTS `t_set_item_details`');
        DB::statement('CREATE VIEW `t_set_item_details` AS SELECT * FROM `t_set_item_details`');
    }

    public function down(): void
    {
        // 互換VIEWを先に削除
        DB::statement('DROP VIEW IF EXISTS `t_set_item_details`');

        // 外部キー解除（存在しなくても続行）
        try { DB::statement('ALTER TABLE `t_set_item_details` DROP FOREIGN KEY `t_set_item_details_item_id_foreign`'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE `t_set_item_details` DROP FOREIGN KEY `t_set_item_details_set_item_id_foreign`'); } catch (\Throwable $e) {}

        Schema::dropIfExists('t_set_item_details');
    }
};
