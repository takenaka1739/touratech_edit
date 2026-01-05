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
        Schema::table('t_customers', function (Blueprint $table) {
            $table->renameColumn('email_pc', 'email_main');//<-記述
        });

        Schema::table('t_customers', function (Blueprint $table) {
            $table->string('email_main', 255)->comment('メールアドレス（メイン）')->change();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_customers', function (Blueprint $table) {
            //
        });
    }
};
