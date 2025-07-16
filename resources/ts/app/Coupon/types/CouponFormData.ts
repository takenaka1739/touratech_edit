// resources/ts/app/Coupon/types/CouponFormData.ts

export type CouponRuleInput = {
  id?: number;
  condition_type: string;
  condition_value: string[]; // 複数商品選択に備えて string[] にも対応
  benefit_type: string;
  benefit_value: string;
};

export type CouponFormData = {
  id?: number;
  code: string;
  name: string;
  details?: string;
  start_at: string;
  end_at: string;
  rules: CouponRuleInput[];
};
