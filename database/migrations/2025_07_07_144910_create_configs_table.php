<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('m_configs', function (Blueprint $table) {
            $table->bigIncrements('id')->comment('管理ID');
            $table->unsignedBigInteger('supplier_id')->nullable()->comment('仕入先管理ID');
            $table->string('company_name', 30)->comment('自社名');
            $table->string('zip_code', 8)->comment('郵便番号');
            $table->string('address1', 30)->comment('住所1');
            $table->string('address2', 30)->nullable()->comment('住所2');
            $table->string('tel', 13)->comment('TEL');
            $table->string('fax', 13)->comment('FAX');
            $table->string('email', 128)->comment('MAIL');

            // 口座情報1
            $table->string('account_name1', 30)->comment('口座名1');
            $table->string('bank_name1', 30)->comment('銀行名1');
            $table->string('branch_name1', 30)->comment('支店名1');
            $table->string('account_type1', 30)->comment('口座種別1');
            $table->string('account_number1', 30)->comment('口座番号1');

            // 口座情報2
            $table->string('account_name2', 30)->nullable()->comment('口座名2');
            $table->string('bank_name2', 30)->nullable()->comment('銀行名2');
            $table->string('branch_name2', 30)->nullable()->comment('支店名2');
            $table->string('account_type2', 30)->nullable()->comment('口座種別2');
            $table->string('account_number2', 30)->nullable()->comment('口座番号2');

            $table->string('company_level', 10)->comment('会社レベル');
            $table->integer('sales_tax_rate')->comment('消費税率');
            $table->integer('pre_tax_rate')->comment('変更前税率');
            $table->timestamp('tax_rate_change_at')->nullable()->comment('税率変更日');

            $table->integer('send_trader')->comment('業者向け送料');
            $table->integer('send_personal')->comment('個人向け送料');
            $table->integer('send_price')->comment('代引金額');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('m_configs');
    }
};
