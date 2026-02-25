<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_inquiries_history', function (Blueprint $table) {
            // 件名（テンプレ送信・手入力送信どちらも保存できるように）
            $table->string('subject', 180)
                ->nullable()
                ->after('reply_content')
                ->comment('メール件名');

            // 本文（reply_content(255) では足りないため）
            $table->text('body_text')
                ->nullable()
                ->after('subject')
                ->comment('メール本文（返信内容の実体）');

            // 使用テンプレ（手入力の場合はNULL）
            $table->unsignedBigInteger('mail_template_id')
                ->nullable()
                ->after('body_text')
                ->comment('使用テンプレID（m_mail_templates.id）');

            // 送信状態（問い合わせ返信は基本送信想定のため default=1）
            $table->tinyInteger('send_status')
                ->default(1)
                ->after('mail_template_id')
                ->comment('送信状態（1:送信済 2:送信失敗）');

            // 送信失敗理由
            $table->text('error_message')
                ->nullable()
                ->after('send_status')
                ->comment('送信失敗理由（あれば）');

            // 会話表示・取得のため（あると便利）
            $table->index(['inquiries_id', 'reply_at']);
        });
    }

    public function down(): void
    {
        Schema::table('t_inquiries_history', function (Blueprint $table) {
            // 追加した index を削除（Laravelが自動生成する名前で落とす）
            $table->dropIndex(['inquiries_id', 'reply_at']);

            $table->dropColumn([
                'subject',
                'body_text',
                'mail_template_id',
                'send_status',
                'error_message',
            ]);
        });
    }
};
