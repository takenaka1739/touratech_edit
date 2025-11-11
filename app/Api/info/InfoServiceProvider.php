<?php

namespace App\Api\info;

use Illuminate\Support\Facades\Log; // ★ 追加
use Illuminate\Support\ServiceProvider;

class InfoServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $path = base_path('app/Api/info/routes.php');

        if (file_exists($path)) {
            Log::info('[InfoServiceProvider] loading routes', ['path' => $path]); // ★ 追加
            $this->loadRoutesFrom($path);
            Log::info('[InfoServiceProvider] routes loaded'); // ★ 追加
        } else {
            Log::error('[InfoServiceProvider] routes file not found', ['path' => $path]); // ★ 追加
        }
    }
}
