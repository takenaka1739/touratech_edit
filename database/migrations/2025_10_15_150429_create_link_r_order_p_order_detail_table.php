<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 既存互換のためテーブル名は t_ なし（link_r_order_p_order_detail）
        if (!Schema::hasTable('link_r_order_p_order_detail')) {
            Schema::create('link_r_order_p_order_detail', function (Blueprint $table) {
                // カラム名はそのまま（変更しない）
                $table->unsignedBigInteger('receive_order_detail_id');
                $table->unsignedBigInteger('place_order_detail_id');

                // 複合PK
                $table->primary(
                    ['receive_order_detail_id', 'place_order_detail_id'],
                    'pk_link_r_order_p_order_detail'
                );
            });

            // 外部キー（VIEWには張れないので“実テーブル”がある場合のみ付与）
            if (Schema::hasTable('t_receive_order_details')) {
                Schema::table('link_r_order_p_order_detail', function (Blueprint $table) {
                    $table->foreign(
                        'receive_order_detail_id',
                        'link_r_order_p_order_detail_receive_order_detail_id_foreign'
                    )
                    ->references('id')->on('t_receive_order_details')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                });
            } elseif (Schema::hasTable('receive_order_details')) {
                // 実テーブル名が receive_order_details の環境がある場合のみ（VIEWだと失敗するため注意）
                Schema::table('link_r_order_p_order_detail', function (Blueprint $table) {
                    $table->foreign(
                        'receive_order_detail_id',
                        'link_r_order_p_order_detail_receive_order_detail_id_foreign'
                    )
                    ->references('id')->on('receive_order_details')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
                });
            }
            // place_order_detail_id 側のFKは要求に無いため今回は未付与（必要になれば別マイグで追加可能）
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('link_r_order_p_order_detail');
    }
};
