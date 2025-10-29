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
        Schema::create('t_purchase_details', function (Blueprint $table) {
            // 旧構造に合わせて AUTO_INCREMENT（= old: ALTER TABLE ... AUTO_INCREMENT）
            $table->bigIncrements('id');

            $table->unsignedBigInteger('purchase_id');                 // NOT NULL
            $table->integer('no');                                     // NOT NULL
            $table->integer('item_kind');                              // NOT NULL
            $table->unsignedBigInteger('item_id');                     // NOT NULL

            $table->string('item_number', 50)->nullable()->collation('utf8mb4_unicode_ci');
            $table->string('item_name', 400)->nullable()->collation('utf8mb4_unicode_ci');
            $table->string('item_name_jp', 400)->nullable()->collation('utf8mb4_unicode_ci');

            $table->integer('fraction')->default(3);
            $table->decimal('unit_price', 10, 2);                      // NOT NULL
            $table->integer('quantity');                               // NOT NULL
            $table->decimal('amount', 12, 2);                          // NOT NULL

            $table->integer('sales_tax_rate')->nullable();
            $table->decimal('sales_tax', 12, 2)->nullable();

            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('shipment_plan_id')->nullable();

            // インデックス（旧DDLどおり）
            $table->index(['purchase_id', 'no'], 'purchase_details_purchase_id_no_index');
            $table->index('item_id', 'purchase_details_item_id_foreign');
            $table->index('parent_id', 'purchase_details_parent_id_foreign');

            // 文字コード・照合順
            $table->engine = 'InnoDB';
            $table->collation = 'utf8mb4_unicode_ci';

            // 外部キー（プロジェクト規約に合わせ、テーブル名に接頭辞を付与）
            // - purchases -> t_purchases（トランザクション）
            // - items     -> m_items    （マスター）※実テーブル名が 'items' の場合はここを 'items' に変更してください
            $table->foreign('item_id', 'fk_pd_item_id')
                ->references('id')->on('m_items');

            $table->foreign('parent_id', 'fk_pd_parent_id')
                ->references('id')->on('t_purchase_details')
                ->onDelete('cascade');

            $table->foreign('purchase_id', 'fk_pd_purchase_id')
                ->references('id')->on('t_purchases')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_purchase_details', function (Blueprint $table) {
            // 先にFKを外す
            $table->dropForeign('fk_pd_item_id');
            $table->dropForeign('fk_pd_parent_id');
            $table->dropForeign('fk_pd_purchase_id');
        });

        Schema::dropIfExists('t_purchase_details');
    }
};
