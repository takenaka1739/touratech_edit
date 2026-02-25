<?php

namespace App\Api\ShopMail\Controllers;

use App\Base\Http\Controllers\Controller;
use App\Api\ShopMail\Requests\MailTemplateStoreRequest;
use App\Api\ShopMail\Requests\MailTemplateUpdateRequest;
use App\Api\ShopMail\Services\MailTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MailTemplateController extends Controller
{
    public function __construct(
        private MailTemplateService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cond = $request->all();
        return response()->json($this->service->list($cond));
    }

    public function show(int $id): JsonResponse
    {
        $row = $this->service->find($id);
        return response()->json(['row' => $row]);
    }

    public function store(MailTemplateStoreRequest $request): JsonResponse
    {
        $id = $this->service->create($request->validated());
        return response()->json(['id' => $id]);
    }

    public function update(int $id, MailTemplateUpdateRequest $request): JsonResponse
    {
        $this->service->update($id, $request->validated());
        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);
        return response()->json(['ok' => true]);
    }

    public function detailSettings(): JsonResponse
    {
        return response()->json($this->service->getDetailSettings());
    }

    public function updateDetailSettings(Request $request): JsonResponse
    {
        $rows = $request->input('rows', []);
        if (!is_array($rows)) $rows = [];
        $this->service->updateDetailSettings($rows);
        return response()->json(['ok' => true]);
    }
}
