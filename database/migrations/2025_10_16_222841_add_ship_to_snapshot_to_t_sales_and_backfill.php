<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1) 列追加（存在しなければ）
        if (!Schema::hasTable('t_sales')) {
            return;
        }

        Schema::table('t_sales', function (Blueprint $table) {
            if (!Schema::hasColumn('t_sales', 'ship_to_name')) {
                $table->string('ship_to_name', 50)->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('t_sales', 'ship_to_zip_code')) {
                $table->string('ship_to_zip_code', 8)->nullable()->after('ship_to_name');
            }
            if (!Schema::hasColumn('t_sales', 'ship_to_address1')) {
                $table->string('ship_to_address1', 60)->nullable()->after('ship_to_zip_code');
            }
            if (!Schema::hasColumn('t_sales', 'ship_to_address2')) {
                $table->string('ship_to_address2', 60)->nullable()->after('ship_to_address1');
            }
            if (!Schema::hasColumn('t_sales', 'ship_to_tel')) {
                $table->string('ship_to_tel', 20)->nullable()->after('ship_to_address2');
            }
        });

        // 2) バックフィル（旧列 → 配送先 → 顧客 の優先で埋める）
        $hasDelivery = Schema::hasTable('m_delivery_addresses');

        // 顧客テーブル名を解決（存在するものを優先）
        $customersTbl = null;
        if (Schema::hasTable('t_customers')) {
            $customersTbl = 't_customers';
        } elseif (Schema::hasTable('m_customers')) {
            $customersTbl = 'm_customers';
        } elseif (Schema::hasTable('customers')) {
            $customersTbl = 'customers';
        }

        // 旧 t_sales の住所カラムが残っているか
        $hasOldName    = Schema::hasColumn('t_sales', 'name');
        $hasOldZip     = Schema::hasColumn('t_sales', 'zip_code');
        $hasOldAddr1   = Schema::hasColumn('t_sales', 'address1');
        $hasOldAddr2   = Schema::hasColumn('t_sales', 'address2');
        $hasOldTel     = Schema::hasColumn('t_sales', 'tel');

        // JOIN 断片
        $joinDelivery = $hasDelivery ? "LEFT JOIN m_delivery_addresses d ON d.id = s.delivery_id" : "";
        $joinCustomer = $customersTbl ? "LEFT JOIN {$customersTbl} c ON c.id = s.customer_id" : "";

        // COALESCE 候補を存在に応じて組み立て
        $coNameParts = [];
        $coZipParts  = [];
        $coA1Parts   = [];
        $coA2Parts   = [];
        $coTelParts  = [];

        if ($hasOldName)  $coNameParts[] = "s.name";
        if ($hasOldZip)   $coZipParts[]  = "s.zip_code";
        if ($hasOldAddr1) $coA1Parts[]   = "s.address1";
        if ($hasOldAddr2) $coA2Parts[]   = "s.address2";
        if ($hasOldTel)   $coTelParts[]  = "s.tel";

        if ($hasDelivery) {
            $coNameParts[] = "d.recipient_name";
            $coZipParts[]  = "d.zip_code";
            $coA1Parts[]   = "CONCAT(COALESCE(d.prefectures,''), COALESCE(d.municipality,''))";
            $coA2Parts[]   = "d.number";
            $coTelParts[]  = "d.tel";
        }

        if ($customersTbl) {
            $coNameParts[] = "c.name";
            if (Schema::hasColumn($customersTbl, 'zip_code'))      $coZipParts[] = "c.zip_code";
            $addr1Expr = [];
            if (Schema::hasColumn($customersTbl, 'prefectures'))   $addr1Expr[] = "COALESCE(c.prefectures,'')";
            if (Schema::hasColumn($customersTbl, 'municipality'))  $addr1Expr[] = "COALESCE(c.municipality,'')";
            if ($addr1Expr) $coA1Parts[] = "CONCAT(" . implode(',', $addr1Expr) . ")";
            if (Schema::hasColumn($customersTbl, 'number'))        $coA2Parts[] = "c.number";
            if (Schema::hasColumn($customersTbl, 'tel'))           $coTelParts[] = "c.tel";
        }

        // 空配列対策（必ず何かしら入れる）
        if (!$coNameParts) $coNameParts[] = "''";
        if (!$coZipParts)  $coZipParts[]  = "''";
        if (!$coA1Parts)   $coA1Parts[]   = "''";
        if (!$coA2Parts)   $coA2Parts[]   = "''";
        if (!$coTelParts)  $coTelParts[]  = "''";

        $sql = "
            UPDATE t_sales s
            {$joinDelivery}
            {$joinCustomer}
            SET
              s.ship_to_name      = COALESCE(" . implode(', ', $coNameParts) . "),
              s.ship_to_zip_code  = COALESCE(" . implode(', ', $coZipParts) . "),
              s.ship_to_address1  = COALESCE(" . implode(', ', $coA1Parts) . "),
              s.ship_to_address2  = COALESCE(" . implode(', ', $coA2Parts) . "),
              s.ship_to_tel       = COALESCE(" . implode(', ', $coTelParts) . ")
            WHERE
              (s.ship_to_name IS NULL
               OR s.ship_to_zip_code IS NULL
               OR s.ship_to_address1 IS NULL
               OR s.ship_to_address2 IS NULL
               OR s.ship_to_tel IS NULL)
        ";

        DB::statement($sql);
    }

    public function down(): void
    {
        if (!Schema::hasTable('t_sales')) return;

        Schema::table('t_sales', function (Blueprint $table) {
            foreach (['ship_to_name','ship_to_zip_code','ship_to_address1','ship_to_address2','ship_to_tel'] as $col) {
                if (Schema::hasColumn('t_sales', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
