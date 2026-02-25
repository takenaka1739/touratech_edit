<?php

use Illuminate\Support\Facades\Route;
use App\Api\ShopMail\Controllers\MailTemplateController;
use App\Api\ShopMail\Controllers\MailMessageController;
use App\Api\ShopMail\Controllers\InquiryMailController;

Route::prefix('api/shop-mail')->group(function () {

    // ===== Mail Template Master =====
    Route::get('/templates', [MailTemplateController::class, 'index']);
    Route::get('/templates/{id}', [MailTemplateController::class, 'show']);
    Route::post('/templates', [MailTemplateController::class, 'store']);
    Route::put('/templates/{id}', [MailTemplateController::class, 'update']);
    Route::delete('/templates/{id}', [MailTemplateController::class, 'destroy']);

    // 明細設定（マスタ一式）
    Route::get('/detail-settings', [MailTemplateController::class, 'detailSettings']);
    Route::put('/detail-settings', [MailTemplateController::class, 'updateDetailSettings']);

    // ===== Order Mail Conversation =====
    Route::get('/orders/{receiveOrderId}/messages', [MailMessageController::class, 'orderMessages']);
    Route::post('/orders/{receiveOrderId}/send', [MailMessageController::class, 'sendOrderMail']);

    // 売上ID → 受注ID → messages
    Route::get('/sales/{salesId}/messages', [MailMessageController::class, 'salesMessages']);

    // ===== Inquiries =====
    Route::get('/inquiries', [InquiryMailController::class, 'index']);
    Route::get('/inquiries/{id}', [InquiryMailController::class, 'show']);
    Route::get('/inquiries/{id}/messages', [InquiryMailController::class, 'messages']);
    Route::post('/inquiries/{id}/send', [InquiryMailController::class, 'send']);
});
