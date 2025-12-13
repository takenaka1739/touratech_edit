<?php

namespace App\Api\Item\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'api/item',
  'middleware' => ['api', 'auth', 'check.general']
], function() {
  Route::post('dialog', [ItemController::class, 'dialog']);
  Route::post('refdialog', [ItemController::class, 'refdialog']);
  Route::get('selected/{id}', [ItemController::class, 'selected']);
  Route::post('get_detail', [ItemController::class, 'get_detail']);

  Route::group([
    'middleware' => ['check.admin']
  ], function() {
    Route::post('store_transaction', [ItemController::class, 'store_transaction']);
    Route::put('{id}/update_transaction', [ItemController::class, 'update_transaction']);
    Route::put('display_status/update_all', [ItemController::class, 'updateAllDisplayStatus']);

    Route::post('fetch', [ItemController::class, 'fetch']);
    Route::post('store', [ItemController::class, 'store']);
    Route::get('edit/{id}', [ItemController::class, 'edit']);
    Route::put('edit/{id}', [ItemController::class, 'update']);
    Route::put('/update/{id}', [ItemController::class, 'update']);
    Route::delete('delete/{id}', [ItemController::class, 'delete']);
    Route::post('output', [ItemController::class, 'output']);
    Route::post('get_id', [ItemController::class, 'get_id']);
    Route::post('/output_excel', [ItemController::class, 'output_excel']);

    Route::post('image_store', [ImageController::class, 'store']);
    Route::put('/image_update/{id}', [ImageController::class, 'update']);
    Route::post('/image_server_store', [ImageController::class, 'serverStore']);
    Route::post('/store_image_transaction', [ImageController::class, 'store_transaction']);
    Route::post('/video_server_store', [ImageController::class, 'videoServerStore']);
    Route::delete('image_delete/{id}', [ImageController::class, 'delete']);

    Route::post('/special_sale_store', [SpecialSaleController::class, 'store']);
    Route::put('/special_sale_update/{id}', [SpecialSaleController::class, 'update']);
    Route::delete('/special_sale_delete/{id}', [SpecialSaleController::class, 'delete']); 

    Route::post('/category_store', [CombController::class, 'store']);
    Route::put('/category_edit/{id}', [CombController::class, 'update']);
    Route::delete('/category_delete/{id}', [CombController::class, 'delete']);

    Route::post('/document_store', [DocumentController::class, 'store']);
    Route::post('/document_server_store', [DocumentController::class, 'serverStore']);
    Route::post('/document_images_server_store', [DocumentController::class, 'imageServerStore']);
    Route::put('document_update/{id}', [DocumentController::class, 'update']);
    Route::delete('document_delete/{id}', [DocumentController::class, 'delete']);

    Route::post('image_upload', [UploadController::class, 'store']);
  });
});
