<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_receive_orders', function (Blueprint $table) {
            // MySQLのJSON型可否が不明なので LONGTEXT にして安全運用
            // mail_snapshot は「当時のメール再現」のための確定値を保持する
            $table->longText('mail_snapshot')->nullable()->comment('メール本文再現用スナップショット(JSON文字列)');
        });
    }

    public function down(): void
    {
        Schema::table('t_receive_orders', function (Blueprint $table) {
            $table->dropColumn('mail_snapshot');
        });
    }
};