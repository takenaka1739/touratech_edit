// resources/ts/app/Coupon/types/CouponFormData.ts

export type CouponRuleInput = {
  id?: number;
  condition_type: string;
  condition_value: string[];
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
  is_active: boolean;
  rules: CouponRuleInput[];
};
