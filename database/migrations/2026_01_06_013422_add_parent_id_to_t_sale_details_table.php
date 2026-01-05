<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_sale_details', function (Blueprint $table) {
            // 旧 sales_details と同条件: parent_id bigint unsigned null
            // （追加位置は任意。現行に合わせて after('sales_tax') あたりに置く例）
            $table->unsignedBigInteger('parent_id')->nullable()->after('sales_tax');

            // 旧: ADD KEY sales_details_parent_id_foreign (parent_id)
            $table->index('parent_id', 't_sale_details_parent_id_index');

            // 旧: FK parent_id -> sales_details(id) ON DELETE CASCADE
            // Laravel: 子行（parent_id を持つ側）が親行削除に追随して消える
            $table->foreign('parent_id', 't_sale_details_parent_id_foreign')
                ->references('id')
                ->on('t_sale_details')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('t_sale_details', function (Blueprint $table) {
            // FK → index → column の順
            $table->dropForeign('t_sale_details_parent_id_foreign');
            $table->dropIndex('t_sale_details_parent_id_index');
            $table->dropColumn('parent_id');
        });
    }
};
