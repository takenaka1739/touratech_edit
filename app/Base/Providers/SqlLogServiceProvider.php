<?php

namespace App\Base\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Barryvdh\Debugbar\DataCollector\QueryCollector;
use Barryvdh\Debugbar\DataFormatter\QueryFormatter;

class SqlLogServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
      // .envを見てログ出力を行うかどうかを判別
      if (env('APP_DEBUG') !== true) {
          return;
      }

      $queryCollector = new QueryCollector();
      $queryCollector->setDataFormatter(new QueryFormatter());
      // bindを当て込むための設定
      $queryCollector->setRenderSqlWithParams(true);

      $db = new DB();
      $logOutPut = [];

      // コンソール実行かどうか
      if (App::runningInConsole()) {
          $logOutPut['execType'] = 'console';
          $logOutPut['execCommand'] = implode(' ', $_SERVER['argv']);
      } else {
          $logOutPut['execType'] = 'web';
          $logOutPut['method'] = $_SERVER['REQUEST_METHOD'];
          $logOutPut['URL'] = url()->full();
      }
      $db::listen(
          function ($query, $bindings = null, $time = null, $connectionName = null) use ($logOutPut, $db, $queryCollector) {
              if ($query instanceof \Illuminate\Database\Events\QueryExecuted) {
                  $bindings = $query->bindings;
                  $time = $query->time;
                  $connection = $query->connection;

                  $query = $query->sql;
              } else {
                  $connection = $db->connection($connectionName);
              }

              $queryCollector->addQuery((string) $query, $bindings, $time, $connection);

              // SQLの実行情報を取得
              $sqlExecCollect = $queryCollector->collect();
              foreach ($sqlExecCollect['statements'] as $sqlStatement) {
                  // ログに出力するデータを作成
                  $logOutPut['sql'] = $sqlStatement['sql'];
                  $logOutPut['duration_str'] = $sqlStatement['duration_str'];
              }
              // ログを加工しやすいようにJSONで出力
              Log::channel('sqllog')->debug(json_encode($logOutPut, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
          }
      );
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
    }
}