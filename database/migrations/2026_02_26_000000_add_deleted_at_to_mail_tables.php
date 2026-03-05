<?php
// 新規作成
// パス: database/migrations/2026_02_26_000000_add_deleted_at_to_mail_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // m_mail_templates に deleted_at を追加
        Schema::table('m_mail_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('m_mail_templates', 'deleted_at')) {
                $table->timestamp('deleted_at')->nullable()->after('updated_at');
                $table->index('deleted_at', 'idx_m_mail_templates_deleted_at');
            }
        });

        // m_mail_detail_settings も Service が whereNull('deleted_at') を使っているので同様に追加
        Schema::table('m_mail_detail_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('m_mail_detail_settings', 'deleted_at')) {
                $table->timestamp('deleted_at')->nullable()->after('updated_at');
                $table->index('deleted_at', 'idx_m_mail_detail_settings_deleted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('m_mail_templates', function (Blueprint $table) {
            if (Schema::hasColumn('m_mail_templates', 'deleted_at')) {
                // index が存在しない環境もあるので try 的に落とさない運用にしたいが、
                // migration では存在前提で dropIndex する
                $table->dropIndex('idx_m_mail_templates_deleted_at');
                $table->dropColumn('deleted_at');
            }
        });

        Schema::table('m_mail_detail_settings', function (Blueprint $table) {
            if (Schema::hasColumn('m_mail_detail_settings', 'deleted_at')) {
                $table->dropIndex('idx_m_mail_detail_settings_deleted_at');
                $table->dropColumn('deleted_at');
            }
        });
    }
};