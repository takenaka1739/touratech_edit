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
        Schema::table('m_items', function (Blueprint $table) {
            $table->renameColumn('discountinued_at', 'discontinued_at')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_items', function (Blueprint $table) {
            $table->renameColumn('discountinued_at', 'discontinued_at')->change();
        });
    }
};
