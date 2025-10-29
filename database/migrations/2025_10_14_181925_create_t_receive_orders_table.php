<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('t_receive_orders', function (Blueprint $table) {
            // PK
            $table->bigIncrements('id')->comment('管理ID');

            // 日付
            $table->timestamp('receive_order_date')
                ->useCurrent()
                ->useCurrentOnUpdate()
                ->comment('受注日');
            $table->timestamp('delivery_date')->nullable()->comment('納入期日');

            // 得意先
            $table->unsignedBigInteger('customer_id')->nullable()->comment('得意先ID（t_customers.id）');
            $table->string('customer_name', 30)->nullable()->comment('得意先名（スナップショット）');

            // 発送/宛先
            $table->boolean('send_flg')->default(0)->comment('発送フラグ');
            $table->string('name', 30)->nullable()->comment('届け先名');
            $table->string('zip_code', 8)->nullable()->comment('郵便番号');
            $table->string('address1', 30)->nullable()->comment('住所1');
            $table->string('address2', 30)->nullable()->comment('住所2');
            $table->string('tel', 13)->comment('電話番号');
            $table->string('fax', 13)->nullable()->comment('FAX番号');

            // 区分・担当
            $table->integer('corporate_class')->comment('取引方法/区分');
            $table->unsignedBigInteger('user_id')->nullable()->comment('担当者ID（m_users.id）');

            // 金額
            $table->decimal('shipping_amount', 12, 2)->nullable()->comment('送料');
            $table->decimal('fee', 12, 2)->nullable()->comment('代引手数料');
            $table->decimal('discount', 12, 2)->nullable()->comment('値引');
            $table->decimal('total_amount', 12, 2)->comment('合計金額');

            // 付帯情報
            $table->string('order_no', 30)->nullable()->comment('注文番号');
            $table->text('remarks')->nullable()->comment('備考');

            // 端数/掛率
            $table->integer('rate')->default(100)->comment('掛率');
            $table->integer('fraction')->default(3)->comment('端数');

            // 監査
            $table->timestamps();

            // Index
            $table->index('receive_order_date');
            $table->index('customer_id');
            $table->index('user_id');
            $table->index('order_no');

            // FK（存在する前提。未作成環境ではコメントアウトしてください）
            $table->foreign('customer_id')
                ->references('id')->on('t_customers')
                ->nullOnDelete()->cascadeOnUpdate();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('t_receive_orders');
    }
};
