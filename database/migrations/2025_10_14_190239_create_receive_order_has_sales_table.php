<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('t_receive_order_has_sales')) {
            Schema::create('t_receive_order_has_sales', function (Blueprint $table) {
                // ご提示DDLに合わせた構成
                $table->unsignedBigInteger('receive_order_id')->comment('受注ID（t_receive_orders.id）');
                $table->integer('has_sales')->default(0)->comment('売上有無フラグ(0/1)');

                // 便利なので索引は付与（DDLに影響しない範囲で）
                $table->primary('receive_order_id');
                $table->index('has_sales');

                // 外部キー（必要に応じ有効化／無い環境ではコメントアウト）
                $table->foreign('receive_order_id')
                    ->references('id')->on('t_receive_orders')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('receive_order_has_sales');
    }
};
