<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('t_receive_order_details', function (Blueprint $table) {
            // PK
            $table->bigIncrements('id')->comment('管理ID');

            // 親（受注明細は受注ヘッダに属する）
            $table->unsignedBigInteger('receive_order_id')->comment('受注ID（t_receive_orders.id）');

            // 行情報
            $table->integer('no')->comment('行番号');
            $table->integer('item_kind')->comment('商品種別');
            $table->unsignedBigInteger('item_id')->comment('商品ID（m_items.id）');
            $table->string('item_number', 50)->nullable()->comment('品番');
            $table->string('item_name', 400)->nullable()->comment('商品名');
            $table->string('item_name_jp', 400)->nullable()->comment('商品名（日本語）');

            // 価格・数量
            $table->decimal('sales_unit_price', 10, 2)->nullable()->comment('定価');
            $table->integer('rate')->nullable()->comment('掛率');
            $table->integer('fraction')->default(3)->comment('端数');
            $table->decimal('unit_price', 10, 2)->comment('単価');
            $table->integer('quantity')->comment('数量');
            $table->decimal('amount', 12, 2)->nullable()->comment('金額（税抜/税込は運用に合わせる）');

            // 税
            $table->integer('sales_tax_rate')->nullable()->comment('消費税率(%)');
            $table->decimal('sales_tax', 12, 2)->nullable()->comment('消費税額');

            // 階層関係（構成品など）
            $table->unsignedBigInteger('parent_id')->nullable()->comment('親明細ID（t_receive_order_details.id）');

            // ステータス
            $table->boolean('sales_completed')->default(0)->comment('売上計上完了');
            $table->boolean('place_completed')->default(0)->comment('出荷/引渡完了');

            // 回答日（原仕様通り文字列）
            $table->string('answer_date', 30)->nullable()->comment('回答日');

            // 監査（必要なら）
            $table->timestamps();

            // 一意・索引
            $table->unique(['receive_order_id', 'no'], 'uq_receive_order_rowno');
            $table->index('item_id');
            $table->index('item_number');
            $table->index('parent_id');
            $table->index(['sales_completed', 'place_completed'], 'idx_status_flags');

            // 外部キー
            $table->foreign('receive_order_id')
                ->references('id')->on('t_receive_orders')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            // m_items が存在しない環境では、下のFKはコメントアウトしてください
            $table->foreign('item_id')
                ->references('id')->on('m_items')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            // 自己参照
            $table->foreign('parent_id')
                ->references('id')->on('t_receive_order_details')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_receive_order_details');
    }
};
