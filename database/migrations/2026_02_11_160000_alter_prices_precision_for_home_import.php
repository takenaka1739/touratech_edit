<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // item_temporaries: 取込一時テーブル
        DB::statement("ALTER TABLE item_temporaries
            MODIFY purchase_unit_price DECIMAL(15,2) NULL,
            MODIFY sample_price        DECIMAL(15,2) NULL
        ");

        // m_items: 商品マスタ（取込結果を書き込むので同様に拡張）
        // ※カラムが存在しない環境があり得るため、エラーになったら対象テーブル定義を確認してください
        DB::statement("ALTER TABLE m_items
            MODIFY purchase_unit_price DECIMAL(15,2) NULL,
            MODIFY sample_price        DECIMAL(15,2) NULL
        ");
    }

    public function down(): void
    {
        // 元に戻す（旧互換）
        DB::statement("ALTER TABLE item_temporaries
            MODIFY purchase_unit_price DECIMAL(10,2) NULL,
            MODIFY sample_price        DECIMAL(10,2) NULL
        ");

        DB::statement("ALTER TABLE m_items
            MODIFY purchase_unit_price DECIMAL(10,2) NULL,
            MODIFY sample_price        DECIMAL(10,2) NULL
        ");
    }
};
