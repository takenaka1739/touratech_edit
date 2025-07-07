<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMPersonnelsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_personnels', function (Blueprint $table) {
            $table->id(); // 管理ID
            $table->string('name', 50); // 担当者名
            $table->string('login_id', 50)->unique(); // ログインID
            $table->string('password'); // パスワード（ハッシュ化）
            $table->unsignedTinyInteger('role')->default(0); // 権限（0:一般, 1:管理者, 2:外部）
            $table->timestamps(); // created_at, updated_at
            $table->softDeletes(); // deleted_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_personnels');
    }
}
