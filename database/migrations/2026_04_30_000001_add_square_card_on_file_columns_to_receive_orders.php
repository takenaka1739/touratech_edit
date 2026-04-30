<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('t_receive_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('t_receive_orders', 'square_payment_id')) {
                $table->string('square_payment_id', 191)->nullable()->after('remarks')->comment('Square決済ID');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_status')) {
                $table->string('square_status', 50)->nullable()->after('square_payment_id')->comment('Square決済ステータス');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_payment_flow')) {
                $table->string('square_payment_flow', 50)
                    ->nullable()
                    ->after('square_status')
                    ->comment('Square決済方式: delayed_capture/card_on_file');
            }

            if (!Schema::hasColumn('t_receive_orders', 'customer_payment_id')) {
                $table->unsignedBigInteger('customer_payment_id')
                    ->nullable()
                    ->after('square_payment_flow')
                    ->comment('使用予定の保存カードID（t_customer_payments.id）');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_payment_status')) {
                $table->string('square_payment_status', 50)
                    ->nullable()
                    ->after('customer_payment_id')
                    ->comment('後日決済ステータス: pending/charged/failed/canceled');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_payment_requested_at')) {
                $table->timestamp('square_payment_requested_at')
                    ->nullable()
                    ->after('square_payment_status')
                    ->comment('Square請求実行日時');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_payment_captured_at')) {
                $table->timestamp('square_payment_captured_at')
                    ->nullable()
                    ->after('square_payment_requested_at')
                    ->comment('Square請求成功日時');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_payment_failed_at')) {
                $table->timestamp('square_payment_failed_at')
                    ->nullable()
                    ->after('square_payment_captured_at')
                    ->comment('Square請求失敗日時');
            }

            if (!Schema::hasColumn('t_receive_orders', 'square_payment_error')) {
                $table->text('square_payment_error')
                    ->nullable()
                    ->after('square_payment_failed_at')
                    ->comment('Square請求失敗理由');
            }
        });

        Schema::table('t_receive_orders', function (Blueprint $table) {
            if (Schema::hasColumn('t_receive_orders', 'customer_payment_id')) {
                $table->index('customer_payment_id', 'idx_receive_orders_customer_payment_id');
            }

            if (Schema::hasColumn('t_receive_orders', 'square_payment_status')) {
                $table->index('square_payment_status', 'idx_receive_orders_square_payment_status');
            }
        });

        if (!Schema::hasTable('t_receive_order_square_payment_attempts')) {
            Schema::create('t_receive_order_square_payment_attempts', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('receive_order_id')->comment('受注ID');
                $table->unsignedBigInteger('customer_payment_id')->nullable()->comment('使用した保存カードID（t_customer_payments.id）');
                $table->string('square_payment_id', 191)->nullable()->comment('Square決済ID');
                $table->string('square_status', 50)->nullable()->comment('Square決済ステータス');
                $table->decimal('amount', 12, 2)->nullable()->comment('請求金額');
                $table->string('currency', 3)->default('JPY')->comment('通貨');
                $table->string('idempotency_key', 191)->nullable()->comment('Square冪等キー');
                $table->string('error_code', 100)->nullable()->comment('Squareエラーコード');
                $table->text('error_message')->nullable()->comment('Squareエラー内容');
                $table->unsignedBigInteger('attempted_by')->nullable()->comment('実行担当者ID');
                $table->timestamp('attempted_at')->nullable()->comment('実行日時');
                $table->timestamps();

                $table->index('receive_order_id', 'idx_square_attempts_receive_order_id');
                $table->index('customer_payment_id', 'idx_square_attempts_customer_payment_id');
                $table->index('square_payment_id', 'idx_square_attempts_square_payment_id');
                $table->index('attempted_at', 'idx_square_attempts_attempted_at');

                $table->foreign('receive_order_id')
                    ->references('id')
                    ->on('t_receive_orders')
                    ->cascadeOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('t_receive_order_square_payment_attempts');

        Schema::table('t_receive_orders', function (Blueprint $table) {
            $this->dropIndexIfColumnExists($table, 't_receive_orders', 'customer_payment_id', 'idx_receive_orders_customer_payment_id');
            $this->dropIndexIfColumnExists($table, 't_receive_orders', 'square_payment_status', 'idx_receive_orders_square_payment_status');

            $columns = [
                'square_payment_error',
                'square_payment_failed_at',
                'square_payment_captured_at',
                'square_payment_requested_at',
                'square_payment_status',
                'customer_payment_id',
                'square_payment_flow',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('t_receive_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    private function dropIndexIfColumnExists(Blueprint $table, string $tableName, string $column, string $indexName): void
    {
        if (Schema::hasColumn($tableName, $column)) {
            try {
                $table->dropIndex($indexName);
            } catch (\Throwable $e) {
                // 環境差で index が無い場合は column drop を優先する
            }
        }
    }
};
