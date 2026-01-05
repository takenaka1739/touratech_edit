<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('t_invoice_details', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('invoice_id');
            $table->integer('no');

            // 旧は ON UPDATE CURRENT_TIMESTAMP だが、請求明細としては不適切なので素直に保持
            $table->timestamp('job_date')->nullable();

            $table->integer('detail_kind');
            $table->integer('item_kind')->nullable();

            $table->unsignedBigInteger('item_id')->nullable();
            $table->string('item_name', 400)->nullable();

            $table->integer('fraction')->default(3);

            $table->decimal('unit_price', 10, 2)->nullable();
            $table->integer('quantity')->nullable();
            $table->decimal('amount', 12, 2)->nullable();

            $table->integer('sales_tax_rate')->nullable();
            $table->decimal('sales_tax', 12, 2)->nullable();

            $table->unsignedBigInteger('parent_id')->nullable();

            // インデックス
            $table->index(['invoice_id', 'no'], 'invoice_details_invoice_id_no_index');
            $table->index('item_id', 'invoice_details_item_id_foreign');
            $table->index('parent_id', 'invoice_details_parent_id_foreign');

            // 外部キー
            $table->foreign('invoice_id', 'invoice_details_invoice_id_foreign')
                ->references('id')->on('t_invoices')
                ->onDelete('cascade');

            $table->foreign('item_id', 'invoice_details_item_id_foreign')
                ->references('id')->on('m_items');

            $table->foreign('parent_id', 'invoice_details_parent_id_foreign')
                ->references('id')->on('t_invoice_details')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('t_invoice_details', function (Blueprint $table) {
            // 先にFKを落とす（環境差で名前が違うと落ちないので try ではなく固定名）
            $table->dropForeign('invoice_details_invoice_id_foreign');
            $table->dropForeign('invoice_details_item_id_foreign');
            $table->dropForeign('invoice_details_parent_id_foreign');

            $table->dropIndex('invoice_details_invoice_id_no_index');
            $table->dropIndex('invoice_details_item_id_foreign');
            $table->dropIndex('invoice_details_parent_id_foreign');
        });

        Schema::dropIfExists('t_invoice_details');
    }
};
