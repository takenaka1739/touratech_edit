<?php

namespace App\Api\info;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use App\Api\info\Services\InfoService;

class InfoServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // InfoService のバインド（必要に応じて DI で使えるように）
        $this->app->singleton(InfoService::class, function ($app) {
            return new InfoService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // ルートファイルの読み込み
        $path = base_path('app/Api/info/routes.php');

        if (file_exists($path)) {
            Log::info('[InfoServiceProvider] loading routes', ['path' => $path]);
            require $path;
            Log::info('[InfoServiceProvider] routes file included');
        } else {
            Log::warning('[InfoServiceProvider] routes file not found', ['path' => $path]);
        }
    }
}
