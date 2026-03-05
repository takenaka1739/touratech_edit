<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_receive_orders', function (Blueprint $table) {
            // 使用ポイント数（pt=円割引）。NULL許容で既存データ互換
            if (!Schema::hasColumn('t_receive_orders', 'use_points')) {
                $table->integer('use_points')->nullable()->after('discount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('t_receive_orders', function (Blueprint $table) {
            if (Schema::hasColumn('t_receive_orders', 'use_points')) {
                $table->dropColumn('use_points');
            }
        });
    }
};