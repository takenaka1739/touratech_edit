<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * t_place_orders.user_id の外部キー参照先を
     * t_customers.id → m_personnels.id に変更する
     */
    public function up(): void
    {
        Schema::table('t_place_orders', function (Blueprint $table) {
            // いったん既存の外部キーを削除
            // ログに出ている制約名そのまま指定
            $table->dropForeign('t_place_orders_user_id_foreign');

            // user_id が nullable でない場合は、ON DELETE SET NULL を使う前提なら
            // ここで nullable にしておく必要があります（必要なら以下をコメント解除）
            // $table->unsignedBigInteger('user_id')->nullable()->change();

            // 新しい外部キーを m_personnels.id に張り替え
            $table->foreign('user_id')
                ->references('id')
                ->on('m_personnels')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    /**
     * ロールバック時は t_customers.id に戻す
     */
    public function down(): void
    {
        Schema::table('t_place_orders', function (Blueprint $table) {
            $table->dropForeign('t_place_orders_user_id_foreign');

            $table->foreign('user_id')
                ->references('id')
                ->on('t_customers')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }
};
