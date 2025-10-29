<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('t_link_p_order_purchase', function (Blueprint $table) {
            $table->unsignedBigInteger('place_order_id');
            $table->unsignedBigInteger('purchase_id');

            // 旧DDL踏襲：複合PK
            $table->primary(['place_order_id', 'purchase_id']);

            // 旧DDLのインデックス名を踏襲
            $table->index('purchase_id', 'link_p_order_purchase_purchase_id_foreign');

            // 文字コード/エンジン
            $table->engine = 'InnoDB';
            $table->collation = 'utf8mb4_unicode_ci';

            // 外部キー（トランザクション系へ接頭辞 t_ を付与）
            // ※ 実テーブルが place_orders の場合は ->on('place_orders') に変更してください
            $table->foreign('place_order_id', 'fk_link_pop_place_order_id')
                  ->references('id')->on('t_place_orders');

            $table->foreign('purchase_id', 'fk_link_pop_purchase_id')
                  ->references('id')->on('t_purchases')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_link_p_order_purchase', function (Blueprint $table) {
            $table->dropForeign('fk_link_pop_place_order_id');
            $table->dropForeign('fk_link_pop_purchase_id');
        });

        Schema::dropIfExists('t_link_p_order_purchase');
    }
};
