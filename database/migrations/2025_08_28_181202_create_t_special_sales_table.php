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
        Schema::create('t_special_sales', function (Blueprint $table) {
            $table->id(); // 管理ID
            $table->unsignedBigInteger('item_id'); // 商品ID
            $table->tinyInteger('is_sales_members_only')->default(0); // 会員専用販売

            $table->timestamp('start_at')->nullable(); // 特売開始日
            $table->timestamp('end_at')->nullable(); // 特売終了日

            $table->decimal('special_sale_price', 10, 2)->nullable(); // 特売価格
            $table->integer('refund_rate')->nullable(); // 還元率

            $table->timestamps(); // created_at, updated_at
            $table->softDeletes(); // deleted_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_special_sales');
    }
};
