<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('t_purchases')) {
            return; // ベーステーブルが無ければ何もしない
        }

        $db = DB::getDatabaseName();

        // ── 1) 既存の user_id 外部キーを「存在時のみ」DROP（名前が不明でもOKにする） ──
        try {
            $existing = DB::table('information_schema.KEY_COLUMN_USAGE')
                ->select('CONSTRAINT_NAME')
                ->where('TABLE_SCHEMA', $db)
                ->where('TABLE_NAME', 't_purchases')
                ->where('COLUMN_NAME', 'user_id')
                ->whereNotNull('REFERENCED_TABLE_NAME')
                ->pluck('CONSTRAINT_NAME')
                ->all();

            foreach ($existing as $fkName) {
                try {
                    DB::statement('ALTER TABLE `t_purchases` DROP FOREIGN KEY `'.$fkName.'`');
                } catch (\Throwable $e) {
                    // 環境差は無視
                }
            }
        } catch (\Throwable $e) {
            // information_schema 参照不可でも続行
        }

        // ── 2) 参照先テーブルを決定（m_personnels 優先、無ければ m_users、どちらも無ければスキップ） ──
        if (!Schema::hasColumn('t_purchases', 'user_id')) {
            return; // 外部キー付与の対象カラムが無ければ終了
        }

        $refTable = null;
        if (Schema::hasTable('m_personnels')) {
            $refTable = 'm_personnels';
        } elseif (Schema::hasTable('m_users')) {
            $refTable = 'm_users';
        }

        if ($refTable) {
            try {
                Schema::table('t_purchases', function (Blueprint $table) use ($refTable) {
                    // 明示名で付与（downで安全に外せるように）
                    $table->foreign('user_id', 'fk_t_purchases_user_id')
                        ->references('id')->on($refTable)
                        ->nullOnDelete(); // 参照削除時は NULL
                });
            } catch (\Throwable $e) {
                // 付与失敗は無視（他環境差）
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('t_purchases')) {
            return;
        }

        $db = DB::getDatabaseName();

        // 付与した/既存の user_id 外部キーを存在時のみ DROP
        try {
            $existing = DB::table('information_schema.KEY_COLUMN_USAGE')
                ->select('CONSTRAINT_NAME')
                ->where('TABLE_SCHEMA', $db)
                ->where('TABLE_NAME', 't_purchases')
                ->where('COLUMN_NAME', 'user_id')
                ->whereNotNull('REFERENCED_TABLE_NAME')
                ->pluck('CONSTRAINT_NAME')
                ->all();

            foreach ($existing as $fkName) {
                try {
                    DB::statement('ALTER TABLE `t_purchases` DROP FOREIGN KEY `'.$fkName.'`');
                } catch (\Throwable $e) {}
            }
        } catch (\Throwable $e) {}
    }
};
