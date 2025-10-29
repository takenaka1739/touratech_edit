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
        Schema::create('t_shipment_plans', function (Blueprint $table) {
            $table->bigIncrements('id')->comment('PK');

            $table->date('shipment_plan_date')->comment('到着予定日（c_arrival_date）');
            $table->string('item_number', 64)->comment('品番（DBF: part）');
            $table->string('name', 255)->comment('名称（DBF: name）');

            // 金額・数量系は必要桁に応じて調整してください
            $table->decimal('unit_price', 10, 2)->comment('単価（DBF: price）');
            $table->integer('quantity')->comment('数量（DBF: quantity）');
            $table->decimal('amount', 12, 2)->comment('金額（DBF: total）');

            $table->string('place_order_no', 255)->nullable()->comment('発注出力ファイル名（name から抽出）');

            $table->timestamps();

            // よく使う検索条件にインデックスを付与
            $table->index('shipment_plan_date', 'idx_t_shipment_plans_date');
            $table->index('item_number', 'idx_t_shipment_plans_item_number');
            $table->index(['shipment_plan_date', 'item_number'], 'idx_t_shipment_plans_date_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_shipment_plans');
    }
};
