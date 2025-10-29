<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('t_receive_order_has_p_order')) {
            Schema::create('t_receive_order_has_p_order', function (Blueprint $table) {
                // 旧DDLのカラムはそのまま（命名規則のみ t_ を付与）
                $table->unsignedBigInteger('receive_order_id')->comment('t_receive_orders.id');
                $table->integer('has_p_order')->default(0)->comment('発注有無フラグ');

                // PK（単一）
                $table->primary(['receive_order_id'], 'pk_t_receive_order_has_p_order');

                // 外部キー（親が削除されたら連動削除）
                $table->foreign('receive_order_id', 't_rohpo_receive_order_id_foreign')
                    ->references('id')->on('t_receive_orders')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('t_receive_order_has_p_order');
    }
};
