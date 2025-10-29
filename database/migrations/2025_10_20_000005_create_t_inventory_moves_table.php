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
        Schema::create('t_inventory_moves', function (Blueprint $table) {
            // 旧構造どおり：AUTO_INCREMENT 主キー
            $table->bigIncrements('id');

            // 旧構造どおり：ON UPDATE CURRENT_TIMESTAMP
            $table->timestamp('job_date')->useCurrent()->useCurrentOnUpdate();

            $table->integer('detail_kind'); // NOT NULL

            $table->unsignedBigInteger('sales_id')->nullable();
            $table->unsignedBigInteger('purchase_id')->nullable();

            $table->string('item_number', 50)->collation('utf8mb4_unicode_ci'); // NOT NULL
            $table->integer('quantity')->nullable();

            // 旧構造どおり：created_at のみ（updated_at は無し）
            $table->timestamp('created_at')->nullable();

            // インデックス（旧DDL踏襲の名称）
            $table->index('sales_id', 'inventory_moves_sales_id_foreign');
            $table->index('purchase_id', 'inventory_moves_purchase_id_foreign');
            $table->index('job_date', 'inventory_moves_job_date_index');
            $table->index('item_number', 'inventory_moves_item_number_index');

            // 外部キー（接頭辞付きの実テーブルを参照）
            // ※ 実テーブルが無接頭辞(sales/purchases)の場合は on('sales') / on('purchases') に変更してください
            $table->foreign('purchase_id', 'fk_inventory_moves_purchase_id')
                  ->references('id')->on('t_purchases')
                  ->onDelete('cascade');

            $table->foreign('sales_id', 'fk_inventory_moves_sales_id')
                  ->references('id')->on('t_sales')
                  ->onDelete('cascade');

            // テーブルオプション
            $table->engine = 'InnoDB';
            $table->collation = 'utf8mb4_unicode_ci';
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_inventory_moves', function (Blueprint $table) {
            $table->dropForeign('fk_inventory_moves_purchase_id');
            $table->dropForeign('fk_inventory_moves_sales_id');
        });

        Schema::dropIfExists('t_inventory_moves');
    }
};
