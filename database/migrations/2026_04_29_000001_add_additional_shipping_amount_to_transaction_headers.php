<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['t_estimates', 't_receive_orders', 't_sales'] as $tableName) {
            if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'additional_shipping_amount')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->decimal('additional_shipping_amount', 12, 2)
                    ->nullable()
                    ->after('shipping_amount')
                    ->comment('別途追加送料');
            });
        }
    }

    public function down(): void
    {
        foreach (['t_estimates', 't_receive_orders', 't_sales'] as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'additional_shipping_amount')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('additional_shipping_amount');
            });
        }
    }
};
