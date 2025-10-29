<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * t_purchases.user_id → m_personnels.id のFKを安全に追加します。
     * 既存の同等FKがあれば何もしません。古い名前のFKがあれば削除します。
     */
    public function up(): void
    {
        // 1) まず m_personnels が存在しなければ何もしない
        if (!Schema::hasTable('m_personnels')) {
            return;
        }

        // 2) 既存の "user_id" に紐づくFKがあるか調査
        $dbName = DB::getDatabaseName();

        $existingFks = DB::select(<<<SQL
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME   = 't_purchases'
              AND COLUMN_NAME  = 'user_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        SQL, [$dbName]);

        $existingFkNames = array_map(fn($r) => $r->CONSTRAINT_NAME, $existingFks);

        // 3) 古い名前のFKが残っていればドロップ（例：purchases_user_id_foreign / fk_t_purchases_user_id）
        $candidates = ['purchases_user_id_foreign', 'fk_t_purchases_user_id'];
        foreach ($candidates as $fkName) {
            if (in_array($fkName, $existingFkNames, true)) {
                // 参照先が m_personnels であっても一旦外して付け直す
                DB::statement("ALTER TABLE `t_purchases` DROP FOREIGN KEY `{$fkName}`");
            }
        }

        // 4) すでに m_personnels 参照のFKが無ければ新規追加
        $hasFkToMPersonnels = DB::select(<<<SQL
            SELECT 1
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME   = 't_purchases'
              AND COLUMN_NAME  = 'user_id'
              AND REFERENCED_TABLE_NAME = 'm_personnels'
              AND REFERENCED_COLUMN_NAME = 'id'
            LIMIT 1
        SQL, [$dbName]);

        if (empty($hasFkToMPersonnels)) {
            Schema::table('t_purchases', function (Blueprint $table) {
                $table->foreign('user_id', 'fk_t_purchases_user_id')
                      ->references('id')->on('m_personnels');
            });
        }
    }

    /**
     * 追加した FK（fk_t_purchases_user_id）のみを削除します。
     */
    public function down(): void
    {
        // FKが存在する場合のみDROP
        $dbName = DB::getDatabaseName();
        $exists = DB::select(<<<SQL
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME   = 't_purchases'
              AND CONSTRAINT_NAME = 'fk_t_purchases_user_id'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            LIMIT 1
        SQL, [$dbName]);

        if (!empty($exists)) {
            Schema::table('t_purchases', function (Blueprint $table) {
                $table->dropForeign('fk_t_purchases_user_id');
            });
        }
    }
};
