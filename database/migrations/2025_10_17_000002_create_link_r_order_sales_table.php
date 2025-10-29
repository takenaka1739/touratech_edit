<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 受注 ↔ 売上（ヘッダ）連結テーブル
        Schema::create('t_link_r_order_sales', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('receive_order_id')->comment('受注ID（t_receive_orders.id）');
            $table->unsignedBigInteger('sales_id')->comment('売上ID（t_sales.id）');

            $table->timestamps();

            // 同一受注と売上の重複連結を防止
            $table->unique(['receive_order_id', 'sales_id'], 'uq_t_lros_receive_sales');

            // 参照制約（存在前提）
            $table->foreign('receive_order_id')
                  ->references('id')->on('t_receive_orders')
                  ->cascadeOnDelete();

            $table->foreign('sales_id')
                  ->references('id')->on('t_sales')
                  ->cascadeOnDelete();

            // よく使う検索に備えてインデックス
            $table->index('receive_order_id', 'idx_t_lros_receive');
            $table->index('sales_id', 'idx_t_lros_sales');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_link_r_order_sales');
    }
};
