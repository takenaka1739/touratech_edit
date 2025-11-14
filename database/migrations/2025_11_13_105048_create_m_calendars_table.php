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
        Schema::create('m_calendars', function (Blueprint $table) {
            $table->id();
            $table->string('name', 500)->nullable();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->string('font_color', 30)->nullable();
            $table->string('back_color', 30)->nullable();
            $table->boolean('is_monday')->nullable();
            $table->boolean('is_tuesday')->nullable();
            $table->boolean('is_wednesday')->nullable();
            $table->boolean('is_thursday')->nullable();
            $table->boolean('is_friday')->nullable();
            $table->boolean('is_saturday')->nullable();
            $table->boolean('is_sunday')->nullable();
            $table->timestamps(); // created_at と updated_at を追加
            $table->softDeletes(); // deleted_at を nullable で追加
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_calendars');
    }
};
