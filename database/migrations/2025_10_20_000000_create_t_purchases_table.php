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
        Schema::create('t_purchases', function (Blueprint $table) {
            // 旧構造のまま：id は AUTO_INCREMENT なし（手動採番を想定）
            $table->unsignedBigInteger('id');
            $table->primary('id');

            // 旧構造のまま：ON UPDATE CURRENT_TIMESTAMP を付与
            $table->timestamp('purchase_date')->useCurrent()->useCurrentOnUpdate();

            $table->unsignedBigInteger('user_id')->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();

            // 旧構造の文字セット/照合順に合わせる
            $table->text('remarks')->collation('utf8mb4_unicode_ci')->nullable();

            // 旧構造：created_at / updated_at は NULL 可
            $table->timestamps();

            // インデックス（旧ダンプの名前に合わせて作成）
            $table->index('user_id', 'purchases_user_id_foreign');        // 外部キー制約は付与せず、インデックス名のみ踏襲
            $table->index('purchase_date', 'purchases_purchase_date_index');

            // テーブルオプション（旧構造を踏襲）
            $table->engine   = 'InnoDB';
            $table->collation = 'utf8mb4_unicode_ci';
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_purchases');
    }
};
