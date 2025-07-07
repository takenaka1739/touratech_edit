<?php

namespace App\Web\InventoryImport\Controllers;

use Illuminate\Support\Facades\Route;

Route::group([
  'prefix' => 'web/inventory_import',
  'middleware' => ['web', 'auth', 'check.general']
], function() {
  Route::get('/output/{file_id}', [InventoryImportController::class, 'output']);
});
