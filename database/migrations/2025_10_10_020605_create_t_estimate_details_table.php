<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * 旧 `estimate_details` の定義を忠実に踏襲しつつ、
     * 実体テーブルを `t_estimate_details` として作成。
     * 互換用 VIEW `estimate_details` も併設します。
     *
     * FK 参照先（命名規則あわせ）：
     *  - estimate_id → t_estimates(id)  [ON DELETE CASCADE]
     *  - item_id     → m_items(id)
     *  - parent_id   → t_estimate_details(id)  [ON DELETE CASCADE]
     */
    public function up(): void
    {
        Schema::create('t_estimate_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('estimate_id');                 // NOT NULL
            $table->integer('no');                                     // int(11) NOT NULL
            $table->integer('item_kind');                              // int(11) NOT NULL
            $table->unsignedBigInteger('item_id');                     // NOT NULL
            $table->string('item_number', 50)->nullable();
            $table->string('item_name', 400)->nullable();
            $table->string('item_name_jp', 400)->nullable();
            $table->decimal('sales_unit_price', 10, 2)->nullable();
            $table->integer('rate')->nullable();
            $table->integer('fraction')->default(3);
            $table->decimal('unit_price', 10, 2);                      // NOT NULL
            $table->integer('quantity');                               // int(11) NOT NULL（符号付きのまま）
            $table->decimal('amount', 12, 2)->nullable();
            $table->integer('sales_tax_rate')->nullable();
            $table->decimal('sales_tax', 12, 2)->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();

            // インデックス（元DDL準拠）
            $table->index(['estimate_id', 'no'], 't_estimate_details_estimate_id_no_index');
            $table->index('item_id', 't_estimate_details_item_id_index');
            $table->index('parent_id', 't_estimate_details_parent_id_index');
        });

        // 外部キーは CREATE 後に付与（参照先が存在する前提）
        Schema::table('t_estimate_details', function (Blueprint $table) {
            $table->foreign('estimate_id', 't_estimate_details_estimate_id_foreign')
                  ->references('id')->on('t_estimates')
                  ->onDelete('cascade');

            $table->foreign('item_id', 't_estimate_details_item_id_foreign')
                  ->references('id')->on('m_items');

            $table->foreign('parent_id', 't_estimate_details_parent_id_foreign')
                  ->references('id')->on('t_estimate_details')
                  ->onDelete('cascade');
        });

        // 旧名互換 VIEW
        DB::statement('DROP VIEW IF EXISTS `estimate_details`');
        DB::statement('CREATE VIEW `estimate_details` AS SELECT * FROM `t_estimate_details`');
    }

    public function down(): void
    {
        // 先に VIEW を削除
        DB::statement('DROP VIEW IF EXISTS `estimate_details`');

        // FK を外してから DROP（存在しなくても続行）
        try { DB::statement('ALTER TABLE `t_estimate_details` DROP FOREIGN KEY `t_estimate_details_estimate_id_foreign`'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE `t_estimate_details` DROP FOREIGN KEY `t_estimate_details_item_id_foreign`'); } catch (\Throwable $e) {}
        try { DB::statement('ALTER TABLE `t_estimate_details` DROP FOREIGN KEY `t_estimate_details_parent_id_foreign`'); } catch (\Throwable $e) {}

        Schema::dropIfExists('t_estimate_details');
    }
};
