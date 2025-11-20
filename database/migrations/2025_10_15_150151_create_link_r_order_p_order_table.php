<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 命名規則：リンク系はプレフィックス無し（既存クエリ互換のため t_link_r_order_p_order を採用）
        if (!Schema::hasTable('t_link_r_order_p_order')) {
            Schema::create('t_link_r_order_p_order', function (Blueprint $table) {
                // ★カラムはそのまま（変更しない）
                $table->unsignedBigInteger('receive_order_id');
                $table->unsignedBigInteger('place_order_id');

                // 複合PK
                $table->primary(['receive_order_id', 'place_order_id'], 'pk_link_r_order_p_order');
            });

            // 外部キーは実テーブルにのみ付与（VIEWには張れないため条件付き）
            if (Schema::hasTable('t_receive_orders')) {
                Schema::table('t_link_r_order_p_order', function (Blueprint $table) {
                    $table->foreign('receive_order_id', 'link_r_order_p_order_receive_order_id_foreign')
                          ->references('id')->on('t_receive_orders')
                          ->cascadeOnDelete()
                          ->cascadeOnUpdate();
                });
            } elseif (Schema::hasTable('receive_orders')) {
                // 実テーブル名が receive_orders の環境がある場合のみ（VIEWだと失敗するため注意）
                Schema::table('t_link_r_order_p_order', function (Blueprint $table) {
                    $table->foreign('receive_order_id', 'link_r_order_p_order_receive_order_id_foreign')
                          ->references('id')->on('receive_orders')
                          ->cascadeOnDelete()
                          ->cascadeOnUpdate();
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('t_link_r_order_p_order');
    }
};
