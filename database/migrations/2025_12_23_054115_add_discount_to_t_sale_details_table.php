<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_sale_details', function (Blueprint $table) {
            // 明細単位の値引（円）。正数を値引額として扱う想定（表示側で▲を付ける）
            $table->integer('discount')
                ->default(0)
                ->comment('明細値引（円）')
                ->after('unit_price'); // 位置は運用に合わせて調整
        });
    }

    public function down(): void
    {
        Schema::table('t_sale_details', function (Blueprint $table) {
            $table->dropColumn('discount');
        });
    }
};
