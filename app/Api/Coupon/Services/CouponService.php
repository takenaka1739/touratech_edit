<?php

namespace App\Api\Coupon\Services;

use App\Base\Models\Coupon;
use App\Base\Models\CouponRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CouponService
{
    /**
     * 一覧取得（検索付き）
     *
     * @param array $cond
     * @return array
     */
    public function fetch(array $cond)
    {
        $query = Coupon::select(
            'id',
            'code',
            'name',
            'details',
            'start_at',
            'end_at'
        );

        $query = $this->setCondition($query, $cond);
        $query->orderBy('id', 'desc');

        $result = $query->paginate(config('const.paginate.per_page'))->toArray();

        return $result;
    }

    /**
     * 詳細取得
     *
     * @param int $id
     * @return array
     */
    public function get(int $id): array
    {
        $coupon = Coupon::with('rules')->find($id);

        if (!$coupon) {
            return [];
        }

        $data = $coupon->toArray();
        $data['rules'] = $coupon->rules->map(function ($rule) {
            return [
                'id' => $rule->id,
                'benefit_type' => $rule->benefit_type,
                'benefit_value' => $rule->benefit_value,
                'condition_type' => $rule->condition_type,
                'condition_value' => $rule->condition_value,
                'price_operator' => $rule->price_operator,
            ];
        })->all();

        return $data;
    }

    /**
     * 登録
     *
     * @param array $data
     */
    public function store(array $data): void
    {
        DB::transaction(function () use ($data) {
            $rules = $data['rules'] ?? [];

            if (blank($data['details'] ?? null)) {
                $data['details'] = $this->generateDetailsFromRules($rules);
            }

            unset($data['rules']);
            $coupon = Coupon::create($data);

            foreach ($rules as $rule) {
                CouponRule::create([
                    'coupon_id'       => $coupon->id,
                    'condition_type'  => $rule['condition_type'],
                    'condition_value' => $rule['condition_value'],
                    'price_operator'  => $rule['price_operator'] ?? null,
                    'benefit_type'    => $rule['benefit_type'],
                    'benefit_value'   => $rule['benefit_value'] ?? [],
                ]);
            }
        });
    }

    public function update(int $id, array $data): void
    {
        DB::transaction(function () use ($id, $data) {
            $rules = $data['rules'] ?? [];


            if (!empty($rules)) {
                $data['details'] = $this->generateDetailsFromRules($rules);
            }

            unset($data['rules']);

            $coupon = Coupon::findOrFail($id);
            $coupon->fill($data);
            $coupon->save();

            // --- 差分更新ここから ---
            $existingRules = CouponRule::where('coupon_id', $coupon->id)->get()->keyBy('id');

            $sentIds = collect($rules)->pluck('id')->filter()->map(fn($v) => (int) $v)->toArray();
            $existingIds = $existingRules->keys()->toArray();
            $deleteIds = array_diff($existingIds, $sentIds);

            if (!empty($deleteIds)) {
                CouponRule::whereIn('id', $deleteIds)->delete();
            }
            
            $rules = array_map(function ($r) {
                return (array) $r;
            }, $rules);

            foreach ($rules as $rule) {

                $payload = [
                    'coupon_id'       => $coupon->id,
                    'condition_type'  => $rule['condition_type'],
                    'condition_value' => $rule['condition_value'],
                    'price_operator'  => $rule['price_operator'] ?? null,
                    'benefit_type'    => $rule['benefit_type'],
                    'benefit_value'   => $rule['benefit_value'] ?? [],
                ];

                if (!empty($rule['id']) && $existingRules->has($rule['id'])) {
                    $existingRules[$rule['id']]->update($payload);
                } else {
                    CouponRule::create($payload);
                }
            }
        });
    }

    /**
     * 削除
     *
     * @param int $id
     */
    public function delete(int $id): void
    {
        DB::transaction(function () use ($id) {
            CouponRule::where('coupon_id', $id)->delete();
            Coupon::destroy($id);
        });
    }

    /**
     * 検索条件設定
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $cond
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function setCondition($query, array $cond)
    {
        $cond = new Collection($cond);
        $c_keyword = $cond->get('c_keyword');

        if (!empty($c_keyword)) {
            $keywords = explode(' ', $c_keyword);
            foreach ($keywords as $key) {
                $query->where(function ($query) use ($key) {
                    $query->where('code', 'like', '%' . escape_like($key) . '%')
                          ->orWhere('name', 'like', '%' . escape_like($key) . '%')
                          ->orWhere('details', 'like', '%' . escape_like($key) . '%');
                });
            }
        }

        return $query;
    }

    /**
     * ルール情報から自動的に details を生成
     *
     * @param array $rules
     * @return string
     */
    private function generateDetailsFromRules(array $rules): string
    {
        $descriptions = [];

        foreach ($rules as $rule) {
            $type = $rule['condition_type'] ?? '';
            $value = $rule['condition_value'] ?? '';
            $operator = $rule['price_operator'] ?? '';

            $condition = match ($type) {
                'all_items'     => '全商品',
                'item_id'       => '特定商品',
                'category_id'   => '特定カテゴリ',
                'brand_id'      => '特定ブランド',
                'price'         => match ($operator) {
                    'lte' => $value . '円以下',
                    'eq'  => $value . '円ちょうど',
                    default => $value . '円以上',
                },
                default         => '条件不明',
            };

            $benefit = match ($rule['benefit_type'] ?? '') {
                'discount' => function () use ($rule) {
                    $val = $rule['benefit_value']['value'] ?? '';
                    $type = $rule['benefit_value']['type'] ?? 'yen';
                    return $type === 'percent' ? "{$val}%割引" : "{$val}円割引";
                },
                'free_item' => function () use ($rule) {
                    $desc = $rule['benefit_value']['description'] ?? '';
                    return $desc ? "おまけ（{$desc}）" : "無料商品提供";
                },
                'free_shipping' => fn() => "送料無料",
                default => fn() => "特典不明",
            };

            // match内でクロージャなのでここで呼び出す
            $benefitText = is_callable($benefit) ? $benefit() : $benefit;

            $descriptions[] = "{$condition}で{$benefitText}";
        }

        return implode(' / ', $descriptions);
    }
}
