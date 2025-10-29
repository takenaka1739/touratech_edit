<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * users テーブルが無い環境のため、実際に参照している m_personnels.id を外部キーに設定します。
     * （直前の 000006 の実行で AUTO_INCREMENT 化は完了している前提）
     */
    public function up(): void
    {
        // 既にFKが付いている場合に失敗しないよう、一旦あれば外す
        Schema::table('t_purchases', function (Blueprint $table) {
            try { $table->dropForeign('fk_t_purchases_user_id'); } catch (\Throwable $e) {}
        });

        // m_personnels が存在する場合のみ FK を付与
        if (Schema::hasTable('m_personnels')) {
            Schema::table('t_purchases', function (Blueprint $table) {
                $table->foreign('user_id', 'fk_t_purchases_user_id')
                      ->references('id')->on('m_personnels');
            });
        }
        // ※ m_personnels がまだ無い場合は、このマイグレーションは no-op（FK未設定）で完了します。
    }

    public function down(): void
    {
        Schema::table('t_purchases', function (Blueprint $table) {
            try { $table->dropForeign('fk_t_purchases_user_id'); } catch (\Throwable $e) {}
        });
    }
};
