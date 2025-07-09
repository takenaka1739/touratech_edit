<?php

namespace App\Base\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Barryvdh\Debugbar\DataCollector\QueryCollector;
use Barryvdh\Debugbar\DataFormatter\QueryFormatter;
use Illuminate\Database\Events\QueryExecuted;

class SqlLogServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        if (env('APP_DEBUG') !== true) {
            return;
        }

        $queryCollector = new QueryCollector();
        $queryCollector->setDataFormatter(new QueryFormatter());
        $queryCollector->setRenderSqlWithParams(true);

        $db = new DB();
        $logOutPut = [];

        if (App::runningInConsole()) {
            $logOutPut['execType'] = 'console';
            $logOutPut['execCommand'] = implode(' ', $_SERVER['argv']);
        } else {
            $logOutPut['execType'] = 'web';
            $logOutPut['method'] = $_SERVER['REQUEST_METHOD'];
            $logOutPut['URL'] = url()->full();
        }

        $db::listen(function ($query, $bindings = null, $time = null, $connectionName = null) use ($logOutPut, $db, $queryCollector) {
            if ($query instanceof QueryExecuted) {
                $bindings = $query->bindings;
                $time = $query->time;
                $connection = $query->connection;
                $query = $query->sql;
            } else {
                $connection = $db->connection($connectionName);
            }

            $queryCollector->addQuery((string) $query, $bindings, $time, $connection);

            $sqlExecCollect = $queryCollector->collect();
            foreach ($sqlExecCollect['statements'] as $sqlStatement) {
                $logOutPut['sql'] = $sqlStatement['sql'];
                $logOutPut['duration_str'] = $sqlStatement['duration_str'];
            }

            Log::channel('sqllog')->debug(json_encode($logOutPut, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        });
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
