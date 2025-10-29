<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('t_inventories', function (Blueprint $table) {
            // 旧構造どおり（updated_at は無し）
            $table->string('import_month', 7)->collation('utf8mb4_unicode_ci');  // NOT NULL
            $table->string('item_number', 50)->collation('utf8mb4_unicode_ci');  // NOT NULL
            $table->integer('quantity')->nullable();                              // NULL 許容
            $table->timestamp('created_at')->nullable();                          // NULL 許容

            // 旧DDLのインデックス
            $table->index(['import_month', 'item_number'], 'inventories_import_month_item_number_index');
            $table->index('item_number', 'inventories_item_number_index');

            // テーブルオプション（旧構造準拠）
            $table->engine = 'InnoDB';
            $table->collation = 'utf8mb4_unicode_ci';
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_inventories');
    }
};
