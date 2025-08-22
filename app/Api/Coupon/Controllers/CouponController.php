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
        try {

            $data = $request->validated(); // ← ここで例外が出てる可能性が高い

            if (Coupon::where('code', $data['code'])->where('id', '!=', $id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'このクーポンコードは他のクーポンで使用されています。',
                ], 422);
            }

            $this->service->update($id, $data);

            return $this->success();
        } catch (\Throwable $e) {
            Log::error('❌ update例外発生', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => '内部エラー'], 500);
        }
    }

    public function delete(int $id)
    {
        $this->service->delete($id);
        return $this->success();
    }

    public function toggleActive(int $id)
    {
        try {
            $coupon = Coupon::findOrFail($id);
            $coupon->is_active = !$coupon->is_active;
            $coupon->save();

            return response()->json([
                'success' => true,
                'is_active' => $coupon->is_active,
            ]);
        } catch (\Throwable $e) {
            \Log::error('❌ クーポン有効切替エラー', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => '切り替えに失敗しました',
            ], 500);
        }
    }

}
