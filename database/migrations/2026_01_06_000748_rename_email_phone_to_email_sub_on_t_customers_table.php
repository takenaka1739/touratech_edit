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
            $table->renameColumn('email_phone', 'email_sub');//<-記述
        });

        Schema::table('t_customers', function (Blueprint $table) {
            $table->string('email_sub', 255)->comment('メールアドレス（サブ）')->change();
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
