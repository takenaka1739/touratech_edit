<?php

use Illuminate\Support\Facades\Route;
use App\Api\info\Controllers\TopicController;
use App\Api\info\Controllers\ItemTopicController;

Route::group([
    'prefix' => 'api/info',
    'middleware' => ['api'] // 必要ならauthやcheck.generalを追加
], function() {
    Route::apiResource('topics', TopicController::class);
    Route::apiResource('item-topics', ItemTopicController::class);
});