<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('t_place_order_details')) {
            Schema::create('t_place_order_details', function (Blueprint $table) {
                // 元DDLを踏襲（テーブル名のみ t_ 接頭辞）
                $table->bigIncrements('id');
                $table->unsignedBigInteger('place_order_id');     // 親: t_place_orders.id
                $table->integer('no');
                $table->integer('item_kind');
                $table->unsignedBigInteger('item_id');            // 参照先は m_items.id
                $table->string('item_number', 50)->nullable();
                $table->string('item_name', 400)->nullable();
                $table->string('item_name_jp', 400)->nullable();
                $table->integer('fraction')->default(3);
                $table->decimal('unit_price', 10, 2);
                $table->integer('quantity');
                $table->decimal('amount', 12, 2);
                $table->integer('sales_tax_rate')->nullable();
                $table->decimal('sales_tax', 12, 2)->nullable();
                $table->string('place_order_no', 50)->nullable();
                $table->boolean('purchased')->default(0);
                $table->unsignedBigInteger('parent_id')->nullable();

                // インデックス（名称は衝突回避のため t_ 接頭辞）
                $table->index(['place_order_id','no'], 't_place_order_details_place_order_id_no_index');
                $table->index('item_id', 't_place_order_details_item_id_index');
                $table->index('parent_id', 't_place_order_details_parent_id_index');
            });

            // 外部キー
            Schema::table('t_place_order_details', function (Blueprint $table) {
                // ★ビュー(items)にはFKを張れないため、実テーブル m_items を参照
                $table->foreign('item_id', 't_place_order_details_item_id_foreign')
                    ->references('id')->on('m_items')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();

                // 自己参照（親削除で子も削除）
                $table->foreign('parent_id', 't_place_order_details_parent_id_foreign')
                    ->references('id')->on('t_place_order_details')
                    ->onDelete('cascade');

                // 親ヘッダ（親削除で子も削除）
                $table->foreign('place_order_id', 't_place_order_details_place_order_id_foreign')
                    ->references('id')->on('t_place_orders')
                    ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('t_place_order_details');
    }
};
