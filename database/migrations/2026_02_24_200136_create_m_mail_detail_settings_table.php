<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('m_mail_detail_settings', function (Blueprint $table) {
            $table->id();

            $table->string('field_key', 50)
                ->comment('明細項目キー（m_mail_detail_fields.field_key など）');

            $table->string('display_label', 100)
                ->nullable()
                ->comment('表示名（NULLの場合はデフォルト表示名を使用）');

            $table->tinyInteger('is_display')
                ->default(1)
                ->comment('表示フラグ（0:非表示 1:表示）');

            $table->timestamps();

            // 1項目につき1行の想定（共通設定）
            $table->unique('field_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('m_mail_detail_settings');
    }
};
