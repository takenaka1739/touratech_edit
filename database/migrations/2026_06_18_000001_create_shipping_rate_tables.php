<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('m_prefecture_shipping_rates')) {
            Schema::create('m_prefecture_shipping_rates', function (Blueprint $table) {
                $table->id();
                $table->string('prefecture', 20)->unique()->comment('都道府県');
                $table->decimal('amount', 12, 2)->default(0)->comment('送料');
                $table->unsignedSmallInteger('sort_order')->default(0)->comment('表示順');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('m_remote_island_shipping_rates')) {
            Schema::create('m_remote_island_shipping_rates', function (Blueprint $table) {
                $table->id();
                $table->string('prefecture', 20)->nullable()->comment('都道府県');
                $table->string('municipality', 100)->nullable()->comment('市区町村');
                $table->text('area_names')->nullable()->comment('離島名・地域名');
                $table->decimal('amount', 12, 2)->default(0)->comment('追加送料');
                $table->unsignedSmallInteger('sort_order')->default(0)->comment('表示順');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('m_remote_island_shipping_rates');
        Schema::dropIfExists('m_prefecture_shipping_rates');
    }
};
