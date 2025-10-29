<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 旧テーブル `estimates` のスキーマ（カラム/型/既定値）はそのままに、
     * 新命名 `t_estimates` を作成します。
     * 画面側の既存コード互換のため `estimates` ビューも併設します。
     *
     * 外部キーは、現行の命名規則に合わせて
     *   customers  → t_customers(id)
     *   users      → m_personnels(id)
     * を参照するようにしています（カラム名は変更なし）。
     */
    public function up(): void
    {
        Schema::create('t_estimates', function (Blueprint $table) {
            $table->bigIncrements('id');

            // ※ 元DDL: estimate_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            //   Laravelのメソッドで極力再現
            $table->timestamp('estimate_date')->useCurrent(); // 後で useCurrentOnUpdate を適用（環境により下の DB::statement を使用）
            $table->timestamp('delivery_date')->nullable();

            $table->unsignedBigInteger('customer_id')->nullable()->index();
            $table->string('customer_name', 30)->nullable();

            $table->boolean('send_flg')->default(false);

            $table->string('name', 30)->nullable();
            $table->string('zip_code', 8)->nullable();
            $table->string('address1', 30)->nullable();
            $table->string('address2', 30)->nullable();

            $table->string('tel', 13);              // NOT NULL
            $table->string('fax', 13)->nullable();

            $table->integer('corporate_class');     // NOT NULL（既定値なし）

            $table->unsignedBigInteger('user_id')->nullable()->index();

            $table->decimal('shipping_amount', 12, 2)->nullable();
            $table->decimal('fee', 12, 2)->nullable();
            $table->decimal('discount', 12, 2)->nullable();

            $table->decimal('total_amount', 12, 2); // NOT NULL

            $table->string('order_no', 30)->nullable();

            $table->text('remarks')->nullable();

            $table->integer('rate')->default(100);
            $table->integer('fraction')->default(3);

            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            // 旧DDLにあった index
            $table->index('estimate_date', 't_estimates_estimate_date_index');
        });

        // MySQL 5.7系で Blueprint の useCurrentOnUpdate が効かない場合に備えて、明示的に ON UPDATE を付与
        try {
            DB::statement("
                ALTER TABLE `t_estimates`
                MODIFY `estimate_date` TIMESTAMP NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
            ");
        } catch (\Throwable $e) {
            // 環境により useCurrentOnUpdate が既に効いていれば上記は不要。失敗しても続行。
        }

        // 外部キー（参照先は新命名のテーブルを想定）
        Schema::table('t_estimates', function (Blueprint $table) {
            // customers → t_customers(id)
            if (Schema::hasTable('t_customers')) {
                $table->foreign('customer_id', 't_estimates_customer_id_foreign')
                      ->references('id')->on('t_customers')
                      ->onUpdate('cascade')->onDelete('restrict');
            }
            // users → m_personnels(id)
            if (Schema::hasTable('m_personnels')) {
                $table->foreign('user_id', 't_estimates_user_id_foreign')
                      ->references('id')->on('m_personnels')
                      ->onUpdate('cascade')->onDelete('restrict');
            }
        });

        // 互換 VIEW（既存コードが `estimates` を参照しても動作させるため）
        DB::statement('DROP VIEW IF EXISTS `estimates`');
        DB::statement('CREATE VIEW `estimates` AS SELECT * FROM `t_estimates`');
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS `estimates`');

        // 外部キー削除（存在チェック付き）
        if (Schema::hasTable('t_estimates')) {
            try { DB::statement('ALTER TABLE `t_estimates` DROP FOREIGN KEY `t_estimates_customer_id_foreign`'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE `t_estimates` DROP FOREIGN KEY `t_estimates_user_id_foreign`'); } catch (\Throwable $e) {}
        }

        Schema::dropIfExists('t_estimates');
    }
};
