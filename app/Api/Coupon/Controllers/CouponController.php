<?php

namespace App\Api\Coupon\Controllers;

use App\Base\Http\Controllers\Api\BaseController;
use App\Api\Coupon\Requests\CouponStoreRequest;
use App\Api\Coupon\Requests\CouponUpdateRequest;
use App\Api\Coupon\Services\CouponService;
use App\Base\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * クーポンマスタコントローラー
 */
class CouponController extends BaseController
{
    protected $service;

    public function __construct(CouponService $service)
    {
        $this->service = $service;
    }

    public function selected(int $id)
    {
        $data = $this->service->get($id);
        return $this->success($data);
    }

    public function fetch(Request $request)
    {
        $input = $request->all();
        $data = $this->service->fetch($input);
        return $this->success($data);
    }

    public function edit(int $id)
    {
        $data = $this->service->get($id);
        return $this->success($data);
    }

    /**
     * 登録処理
     */
    public function store(CouponStoreRequest $request)
    {

        $data = $request->validated();

        if (Coupon::where('code', $data['code'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'このクーポンコードはすでに使用されています。',
            ], 422);
        }

        try {
            $this->service->store($data);
            return $this->success();
        } catch (\Exception $e) {
            Log::error('【クーポン登録エラー】', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => '登録に失敗しました。',
            ], 500);
        }
    }

    /**
     * 更新処理
     */
    public function update(CouponUpdateRequest $request, int $id)
    {
        $data = $request->validated();

        // --- 重複チェック（他のIDで同じコードが使われていないか）---
        if (Coupon::where('code', $data['code'])->where('id', '!=', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'このクーポンコードは他のクーポンで使用されています。',
            ], 422);
        }

        try {
            $this->service->update($id, $data);
            return $this->success();
        } catch (\Exception $e) {
            Log::error('【クーポン更新エラー】', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => '更新に失敗しました。',
            ], 500);
        }
    }

    public function delete(int $id)
    {
        $this->service->delete($id);
        return $this->success();
    }
}
