<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('m_images', 'item_code')) {
            Schema::table('m_images', function (Blueprint $table) {
                $table->string('item_code', 30)->nullable()->after('item_id')->index('m_images_item_code_index');
            });
        }

        if (Schema::hasTable('m_items')) {
            DB::statement("
                UPDATE m_images AS img
                INNER JOIN m_items AS item ON item.id = img.item_id
                SET img.item_code = item.code
                WHERE img.item_id IS NOT NULL
                  AND img.item_code IS NULL
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('m_images', 'item_code')) {
            Schema::table('m_images', function (Blueprint $table) {
                $table->dropIndex('m_images_item_code_index');
                $table->dropColumn('item_code');
            });
        }
    }
};
