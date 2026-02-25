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
        Schema::create('t_mail_messages', function (Blueprint $table) {
            $table->id();

            // 会話キー（受注ID固定）
            $table->unsignedBigInteger('receive_order_id')
                  ->comment('受注ID（t_receive_orders.id）');

            $table->unsignedBigInteger('customer_id')
                  ->nullable()
                  ->comment('顧客ID');

            $table->tinyInteger('direction')
                  ->default(1)
                  ->comment('1:送信 2:受信');

            $table->tinyInteger('send_status')
                  ->default(1)
                  ->comment('1:送信済 2:送信失敗');

            $table->string('to_email', 255)
                  ->comment('宛先メール');

            $table->string('subject', 180)
                  ->comment('件名');

            $table->longText('body')
                  ->comment('本文（確定文）');

            $table->unsignedBigInteger('mail_template_id')
                  ->nullable()
                  ->comment('使用テンプレID（m_mail_templates.id）');

            $table->dateTime('sent_at')
                  ->nullable()
                  ->comment('送信日時');

            $table->text('error_message')
                  ->nullable()
                  ->comment('送信失敗理由');

            $table->unsignedBigInteger('created_by')
                  ->nullable()
                  ->comment('作成者ユーザーID');

            $table->timestamps();

            // インデックス
            $table->index(['receive_order_id', 'created_at']);
            $table->index('customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_mail_messages');
    }
};
