<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRateToTSaleDetailsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('t_sale_details', function (Blueprint $table) {
            // sales_unit_price のあとあたりが分かりやすいと思います
            $table->integer('rate')
                ->nullable()
                ->comment('掛率')
                ->after('sales_unit_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_sale_details', function (Blueprint $table) {
            $table->dropColumn('rate');
        });
    }
}
