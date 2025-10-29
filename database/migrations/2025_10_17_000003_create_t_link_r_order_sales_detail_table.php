<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('t_link_r_order_sales_detail', function (Blueprint $table) {
            $table->bigIncrements('id');

            // 受注明細 ↔ 売上明細（多対多の連結）
            $table->unsignedBigInteger('receive_order_detail_id')->comment('受注明細ID（t_receive_order_details.id）');
            $table->unsignedBigInteger('sales_detail_id')->comment('売上明細ID（t_sale_details.id）');

            $table->timestamps();

            // 同一ペアの重複登録防止
            $table->unique(
                ['receive_order_detail_id', 'sales_detail_id'],
                'uq_lrosd_receive_detail_sales_detail'
            );

            // 外部キー（既存テーブルに合わせて t_ 接頭辞）
            $table->foreign('receive_order_detail_id')
                  ->references('id')->on('t_receive_order_details')
                  ->cascadeOnDelete();

            $table->foreign('sales_detail_id')
                  ->references('id')->on('t_sale_details')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_link_r_order_sales_detail');
    }
};
