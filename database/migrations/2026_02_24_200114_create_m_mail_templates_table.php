<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('m_mail_templates', function (Blueprint $table) {
            $table->id();

            $table->tinyInteger('template_type')
                ->default(1)
                ->comment('1:自動返信 2:個別送信');

            $table->string('title', 100)
                ->comment('管理画面表示用タイトル');

            $table->string('subject_template', 180)
                ->comment('メール件名テンプレ（全角60以内はアプリ側制御）');

            $table->text('header_template')
                ->nullable()
                ->comment('メールヘッダー部（全角2048以内はアプリ側制御）');

            $table->text('footer_template')
                ->nullable()
                ->comment('メールフッター部（全角2048以内はアプリ側制御）');

            $table->tinyInteger('detail_mode')
                ->default(0)
                ->comment('明細表示（0:表示しない 1:表示する）');

            $table->tinyInteger('payment_url_enabled')
                ->default(0)
                ->comment('支払いURL表示（0:しない 1:する）※個別送信のみ想定');

            $table->text('shipping_text')
                ->nullable()
                ->comment('配送データ記載欄（個別送信用/全角2048以内はアプリ側制御）');

            $table->tinyInteger('is_active')
                ->default(1)
                ->comment('有効フラグ（0:無効 1:有効）');

            $table->timestamps();

            // 一覧用（テンプレ種別＋有効）
            $table->index(['template_type', 'is_active', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('m_mail_templates');
    }
};
