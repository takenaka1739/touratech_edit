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
        Schema::create('item_temporaries', function (Blueprint $table) {
            // 旧DB: item_number varchar(50) NOT NULL
            $table->string('item_number', 50);

            // 旧DB: name varchar(400) NULL
            $table->string('name', 400)->nullable();

            // 旧DB: purchase_unit_price decimal(10,2) NULL
            $table->decimal('purchase_unit_price', 10, 2)->nullable();

            // 旧DB: sample_price decimal(10,2) NULL
            $table->decimal('sample_price', 10, 2)->nullable();

            // 旧DB: supplier_id bigint unsigned NULL
            $table->unsignedBigInteger('supplier_id')->nullable();

            // 旧DB: is_discontinued tinyint(1) NULL
            // Laravel的には boolean でもOKだが、旧互換優先で tinyInteger を採用
            $table->tinyInteger('is_discontinued')->nullable();

            // 旧DB: overseas_stock int NULL
            $table->integer('overseas_stock')->nullable();

            // 旧DB: edit_kind int NULL
            $table->integer('edit_kind')->nullable();

            // 旧DB: remarks text NULL
            $table->text('remarks')->nullable();

            // 旧DB: item_number に index
            $table->index('item_number', 'item_temporaries_item_number_index');

            /**
             * 注意:
             * 旧DBは PRIMARY KEY なし・timestamps なし。
             * 取り込み用一時テーブルとして旧挙動に合わせるため追加しない。
             */
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_temporaries');
    }
};
