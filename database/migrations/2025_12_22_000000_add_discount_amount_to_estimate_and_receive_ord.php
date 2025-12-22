<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 見積明細：商品行ごとの割引額（税抜/税込どちらで持つかは運用で統一）
        Schema::table('t_estimate_details', function (Blueprint $table) {
            if (!Schema::hasColumn('t_estimate_details', 'discount')) {
                $table->decimal('discount', 12, 2)
                    ->nullable()
                    ->comment('割引額（明細行）')
                    ->after('unit_price');
            }
        });

        // 受注明細：商品行ごとの割引額
        Schema::table('t_receive_order_details', function (Blueprint $table) {
            if (!Schema::hasColumn('t_receive_order_details', 'discount')) {
                $table->decimal('discount', 12, 2)
                    ->nullable()
                    ->comment('割引額（明細行）')
                    ->after('unit_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('t_estimate_details', function (Blueprint $table) {
            if (Schema::hasColumn('t_estimate_details', 'discount')) {
                $table->dropColumn('discount');
            }
        });

        Schema::table('t_receive_order_details', function (Blueprint $table) {
            if (Schema::hasColumn('t_receive_order_details', 'discount')) {
                $table->dropColumn('discount');
            }
        });
    }
};
