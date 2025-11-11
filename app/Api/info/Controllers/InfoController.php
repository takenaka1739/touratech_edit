<?php

namespace App\Api\info\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\info\Services\InfoService;
use App\Api\info\Requests\StoreInfoRequest;
use App\Api\info\Requests\UpdateInfoRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InfoController extends BaseController
{
    public function __construct(private InfoService $service)
    {
        Log::info('[InfoController] __construct'); // ★
    }

    public function indexShop(Request $req)
    {
        Log::info('[InfoController] indexShop', ['q' => $req->query()]);
        return $this->indexByType('shop', $req);
    }

    public function indexProduct(Request $req)
    {
        Log::info('[InfoController] indexProduct', ['q' => $req->query()]);
        return $this->indexByType('product', $req);
    }

    protected function indexByType(string $type, Request $req)
    {
        $onlyPublic = (int)$req->query('only_public', 0) === 1;
        $limit      = (int)$req->query('limit', 0);
        Log::info('[InfoController] indexByType', compact('type', 'onlyPublic', 'limit')); // ★

        try {
            $rows = $this->service->listByType($type, $onlyPublic, $limit);
            return response()->json($rows);
        } catch (\Throwable $e) {
            Log::error('[InfoController] index error', ['type' => $type, 'ex' => $e]);
            return response()->json(['message' => 'failed to fetch'], 500);
        }
    }

    public function storeShop(StoreInfoRequest $req)
    {
        Log::info('[InfoController] storeShop', ['payload' => $req->all()]); // ★
        return $this->storeByType('shop', $req);
    }

    public function storeProduct(StoreInfoRequest $req)
    {
        Log::info('[InfoController] storeProduct', ['payload' => $req->all()]); // ★
        return $this->storeByType('product', $req);
    }

    protected function storeByType(string $type, StoreInfoRequest $req)
    {
        try {
            $row = $this->service->create($type, $req->validated(), auth()->id());
            Log::info('[InfoController] store ok', ['type' => $type, 'id' => $row['id'] ?? null]); // ★
            return response()->json($row, 201);
        } catch (\Throwable $e) {
            Log::error('[InfoController] store error', ['type' => $type, 'ex' => $e]);
            return response()->json(['message' => 'failed to create'], 500);
        }
    }

    public function updateShop(UpdateInfoRequest $req, int $id)
    {
        Log::info('[InfoController] updateShop', ['id' => $id, 'payload' => $req->all()]); // ★
        return $this->updateByType('shop', $id, $req);
    }

    public function updateProduct(UpdateInfoRequest $req, int $id)
    {
        Log::info('[InfoController] updateProduct', ['id' => $id, 'payload' => $req->all()]); // ★
        return $this->updateByType('product', $id, $req);
    }

    protected function updateByType(string $type, int $id, UpdateInfoRequest $req)
    {
        try {
            $row = $this->service->update($type, $id, $req->validated(), auth()->id());
            Log::info('[InfoController] update ok', ['type' => $type, 'id' => $id]); // ★
            return response()->json($row);
        } catch (\Throwable $e) {
            Log::error('[InfoController] update error', ['type' => $type, 'id' => $id, 'ex' => $e]);
            return response()->json(['message' => 'failed to update'], 500);
        }
    }

    public function destroyShop(int $id)
    {
        Log::info('[InfoController] destroyShop', ['id' => $id]); // ★
        return $this->destroyByType('shop', $id);
    }

    public function destroyProduct(int $id)
    {
        Log::info('[InfoController] destroyProduct', ['id' => $id]); // ★
        return $this->destroyByType('product', $id);
    }

    protected function destroyByType(string $type, int $id)
    {
        try {
            $this->service->delete($type, $id, auth()->id());
            Log::info('[InfoController] destroy ok', ['type' => $type, 'id' => $id]); // ★
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::error('[InfoController] destroy error', ['type' => $type, 'id' => $id, 'ex' => $e]);
            return response()->json(['message' => 'failed to delete'], 500);
        }
    }
}
