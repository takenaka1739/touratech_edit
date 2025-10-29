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
        Schema::create('t_link_p_order_purchase_detail', function (Blueprint $table) {
            $table->unsignedBigInteger('place_order_detail_id');
            $table->unsignedBigInteger('purchase_detail_id');

            // 旧DDL踏襲：複合PK
            $table->primary(['place_order_detail_id', 'purchase_detail_id']);

            // 旧DDLのインデックス名を踏襲
            $table->index('purchase_detail_id', 'link_p_order_purchase_detail_purchase_detail_id_foreign');

            // 外部キー（接頭辞付きの実テーブルを参照）
            // ※ place_order_details が無接頭辞の場合は on('place_order_details') に変更してください
            $table->foreign('place_order_detail_id', 'fk_link_popd_place_order_detail_id')
                  ->references('id')->on('t_place_order_details');

            $table->foreign('purchase_detail_id', 'fk_link_popd_purchase_detail_id')
                  ->references('id')->on('t_purchase_details')
                  ->onDelete('cascade');

            // テーブルオプション（旧構造準拠）
            $table->engine = 'InnoDB';
            $table->collation = 'utf8mb4_unicode_ci';
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_link_p_order_purchase_detail', function (Blueprint $table) {
            $table->dropForeign('fk_link_popd_place_order_detail_id');
            $table->dropForeign('fk_link_popd_purchase_detail_id');
        });

        Schema::dropIfExists('t_link_p_order_purchase_detail');
    }
};
