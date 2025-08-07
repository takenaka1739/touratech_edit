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
            'end_at',
            'is_active'
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
            $benefitValue = $rule->benefit_value;

            // 文字列の場合はjson_decode
            if (is_string($benefitValue)) {
                $decoded = json_decode($benefitValue, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $benefitValue = $decoded;
                }
            }

            return [
                'id' => $rule->id,
                'benefit_type' => $rule->benefit_type,
                'benefit_value' => $benefitValue,
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
                // benefit_value の整形（既存）
                if (isset($rule['benefit_value']) && is_string($rule['benefit_value'])) {
                    $rule['benefit_value'] = json_decode($rule['benefit_value'], true);
                }

                // 送料無料
                if ($rule['benefit_type'] === 'free_shipping') {
                    $rule['benefit_value'] = [
                        'type' => 'free_shipping',
                        'value' => true,
                    ];
                }

                // 無料商品
                if ($rule['benefit_type'] === 'free_item') {
                    $description = '';
                    if (is_array($rule['benefit_value']) && isset($rule['benefit_value']['description'])) {
                        $description = $rule['benefit_value']['description'];
                    } elseif (is_array($rule['benefit_value']) && isset($rule['benefit_value']['value'])) {
                        $description = $rule['benefit_value']['value'];
                    } elseif (is_string($rule['benefit_value'])) {
                        $decoded = json_decode($rule['benefit_value'], true);
                        if (json_last_error() === JSON_ERROR_NONE && isset($decoded['description'])) {
                            $description = $decoded['description'];
                        }
                    }
                    $rule['benefit_value'] = [
                        'type' => 'description',
                        'value' => $description,
                    ];
                }

                // 特別な商品（special_item）は type/valueのみ
                if ($rule['benefit_type'] === 'special_item') {
                    $value = '';
                    if (is_array($rule['benefit_value'])) {
                        $value = $rule['benefit_value']['value'] ?? '';
                    }
                    $rule['benefit_value'] = [
                        'type' => 'special_item',
                        'value' => $value,
                    ];
                }

                // 割引タイプのみ値をfloatに
                if (
                    isset($rule['benefit_value']) &&
                    is_array($rule['benefit_value']) &&
                    isset($rule['benefit_value']['value']) &&
                    in_array($rule['benefit_value']['type'] ?? null, ['yen', 'percent'], true)
                ) {
                    $rule['benefit_value']['value'] = (float) $rule['benefit_value']['value'];
                }

                // condition_value の整形
                $conditionValue = $rule['condition_value'];
                if (is_string($conditionValue)) {
                    $decoded = json_decode($conditionValue, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $conditionValue = $decoded;
                    }
                }

                CouponRule::create([
                    'coupon_id'       => $coupon->id,
                    'condition_type'  => $rule['condition_type'],
                    'condition_value' => $conditionValue,
                    'price_operator'  => $rule['price_operator'] ?? null,
                    'benefit_type'    => $rule['benefit_type'],
                    'benefit_value'   => $rule['benefit_value'] ?? [],
                ]);
            }
        });
    }

    public function update(int $id, array $data): void
    {
        try {
            DB::transaction(function () use ($id, $data) {
                $rules = $data['rules'] ?? [];

                Log::debug('🧪 [update] 受信ルール一覧');

                if (!empty($rules)) {
                    $data['details'] = $this->generateDetailsFromRules($rules);
                }

                unset($data['rules']);

                $coupon = Coupon::findOrFail($id);
                $coupon->fill($data);
                $coupon->save();

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
                    // benefit_value デコード
                    if (isset($rule['benefit_value']) && is_string($rule['benefit_value'])) {
                        $rule['benefit_value'] = json_decode($rule['benefit_value'], true);
                    }

                    // 送料無料
                    if ($rule['benefit_type'] === 'free_shipping') {
                        $rule['benefit_value'] = [
                            'type' => 'free_shipping',
                            'value' => true,
                        ];
                    }

                    // 無料商品
                    if ($rule['benefit_type'] === 'free_item') {
                        $description = '';
                        if (is_array($rule['benefit_value']) && isset($rule['benefit_value']['description'])) {
                            $description = $rule['benefit_value']['description'];
                        } elseif (is_array($rule['benefit_value']) && isset($rule['benefit_value']['value'])) {
                            $description = $rule['benefit_value']['value'];
                        } elseif (is_string($rule['benefit_value'])) {
                            $decoded = json_decode($rule['benefit_value'], true);
                            if (json_last_error() === JSON_ERROR_NONE && isset($decoded['description'])) {
                                $description = $decoded['description'];
                            }
                        }
                        $rule['benefit_value'] = [
                            'type' => 'description',
                            'value' => $description,
                        ];
                    }

                    // 特別な商品
                    if ($rule['benefit_type'] === 'special_item') {
                        $value = '';
                        if (is_array($rule['benefit_value'])) {
                            $value = $rule['benefit_value']['value'] ?? '';
                        }
                        $rule['benefit_value'] = [
                            'type' => 'special_item',
                            'value' => $value,
                        ];
                    }

                    // 割引タイプの値を float に整形
                    if (
                        isset($rule['benefit_value']) &&
                        is_array($rule['benefit_value']) &&
                        isset($rule['benefit_value']['value']) &&
                        in_array($rule['benefit_value']['type'] ?? null, ['yen', 'percent'], true)
                    ) {
                        $rule['benefit_value']['value'] = (float) $rule['benefit_value']['value'];
                    }

                    // condition_value のデコード
                    $conditionValue = $rule['condition_value'];
                    if (is_string($conditionValue)) {
                        $decoded = json_decode($conditionValue, true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $conditionValue = $decoded;
                        }
                    }

                    $payload = [
                        'coupon_id'       => $coupon->id,
                        'condition_type'  => $rule['condition_type'],
                        'condition_value' => $conditionValue,
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
        } catch (\Throwable $e) {
            Log::error('【クーポン更新エラー】', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw $e;
        }
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
                    $desc = $rule['benefit_value']['value'] ?? ($rule['benefit_value']['description'] ?? '');
                    return $desc ? "おまけ（{$desc}）" : "無料商品提供";
                },
                'special_item' => function () use ($rule) {
                    $val = $rule['benefit_value']['value'] ?? '';
                    return $val ? "特別な商品（{$val}）" : "特別な商品提供";
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
