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
       Schema::create('t_sales', function (Blueprint $table) {
        $table->id();
        $table->foreignId('item_id')->constrained('m_items');
        $table->foreignId('customer_id')->constrained('t_customers');
        $table->foreignId('personnel_id')->nullable()->constrained('users'); // 担当者ID: 利用者テーブル等
        $table->foreignId('payment_id')->constrained('m_payments'); // 支払い方法

        $table->string('invoice_number')->nullable();
        $table->tinyInteger('is_invoice_check')->default(0)->comment('0: 確認, 1: 未確認');
        $table->string('shipping_invoice_number')->nullable();
        $table->integer('sales_form')->nullable()->comment('PC/携帯/スマホ');
        $table->integer('sales_type')->nullable()->comment('本売上/予約売上');
        $table->timestamp('sales_at')->index()->nullable();
        $table->timestamp('billing_at')->nullable();
        $table->timestamp('payment_at')->nullable()->comment('入力があれば入金済み');
        $table->decimal('shipping_amount', 12, 2)->nullable();
        $table->decimal('fee', 12, 2)->nullable();
        $table->decimal('discount', 12, 2)->nullable();
        $table->decimal('total_amount', 12, 2);
        $table->boolean('is_send')->comment('発送有無/0:未発送/1:発送済み');
        $table->timestamp('shipped_at')->nullable();
        $table->timestamp('delivery_at')->nullable();
        $table->tinyInteger('is_individual_email_sent')->default(0);
        $table->string('order_no', 30)->nullable();
        $table->string('remarks', 100)->nullable();
        $table->timestamps();
        $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_sales');
    }
};
