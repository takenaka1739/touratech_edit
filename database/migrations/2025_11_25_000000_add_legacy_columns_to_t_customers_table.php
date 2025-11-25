<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_customers', function (Blueprint $table) {

            // 支払方法
            if (!Schema::hasColumn('t_customers', 'corporate_class')) {
                $table->unsignedTinyInteger('corporate_class')
                    ->nullable()
                    ->default(1)
                    ->comment('支払方法')
                    ->after('fraction');
            }

            // 口座選択
            if (!Schema::hasColumn('t_customers', 'bank_class')) {
                $table->unsignedTinyInteger('bank_class')
                    ->nullable()
                    ->default(1)
                    ->comment('口座選択')
                    ->after('corporate_class');
            }

            // 締日
            if (!Schema::hasColumn('t_customers', 'cutoff_date')) {
                $table->unsignedTinyInteger('cutoff_date')
                    ->default(31)
                    ->comment('締日')
                    ->after('bank_class');
            }

            // remarks は追加しない（notice が既に備考として存在するため）

        });
    }

    public function down(): void
    {
        Schema::table('t_customers', function (Blueprint $table) {
            if (Schema::hasColumn('t_customers', 'cutoff_date')) {
                $table->dropColumn('cutoff_date');
            }
            if (Schema::hasColumn('t_customers', 'bank_class')) {
                $table->dropColumn('bank_class');
            }
            if (Schema::hasColumn('t_customers', 'corporate_class')) {
                $table->dropColumn('corporate_class');
            }
            // remarks は元々追加しないため削除しない
        });
    }
};
