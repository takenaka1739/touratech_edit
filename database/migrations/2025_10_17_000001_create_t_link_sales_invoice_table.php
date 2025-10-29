<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 売上 ↔ 請求 連結（旧: link_sales_invoice）※トランザクション系なので t_ 接頭辞
        Schema::create('t_link_sales_invoice', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('sales_id')->comment('売上ID（t_sales.id）');
            // 将来的な請求テーブル（例：t_invoices）に対応。現時点ではNULL許容
            $table->unsignedBigInteger('invoice_id')->nullable()->comment('請求ID（t_invoices.id 想定）');

            $table->timestamps();

            // 同一売上に対して複数請求を許容するかは運用次第。とりあえず複合ユニークは張らない
            $table->index('sales_id');

            // 参照制約（存在前提）
            $table->foreign('sales_id')->references('id')->on('t_sales')->cascadeOnDelete();
            // $table->foreign('invoice_id')->references('id')->on('t_invoices')->nullOnDelete(); // 請求テーブル作成時に有効化
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_link_sales_invoice');
    }
};
