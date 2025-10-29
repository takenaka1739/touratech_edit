<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 現行規約：テーブル名は t_ プレフィックス
        if (!Schema::hasTable('t_place_orders')) {
            Schema::create('t_place_orders', function (Blueprint $table) {
                $table->bigIncrements('id');

                $table->timestamp('place_order_date')
                    ->useCurrent()
                    ->useCurrentOnUpdate()
                    ->comment('発注日');

                // ★カラム名は旧システムのまま user_id を使用（参照先だけ t_customers）
                $table->unsignedBigInteger('user_id')->nullable()->comment('取引先ID（t_customers.id）');

                $table->string('delivery_day', 30)->nullable()->comment('納期/回答日など');
                $table->decimal('total_amount', 12, 2)->nullable()->comment('合計金額');
                $table->text('remarks')->nullable()->comment('備考');
                $table->integer('fraction')->default(3)->comment('端数');
                $table->string('order_file_name', 100)->nullable()->comment('発注書ファイル名');

                $table->timestamps();

                // index（名称は一意なら任意）
                $table->index('place_order_date', 't_place_orders_place_order_date_index');
                $table->index('user_id', 't_place_orders_user_id_index');

                // FK：users ではなく t_customers を参照
                $table->foreign('user_id', 't_place_orders_user_id_foreign')
                    ->references('id')->on('t_customers')
                    ->nullOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('t_place_orders');
    }
};
