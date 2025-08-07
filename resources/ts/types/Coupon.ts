// resources/ts/types/Coupon.ts

export type Coupon = {
  id: number;
  code: string;
  name: string;
  details: string;
  start_at: string;
  end_at: string;
  benefit_type: string;
  discount_rate: string;
  benefit_details: string;
  is_active: boolean;
};

export type CouponRule = {
  id?: number;
  benefit_type: string;
  benefit_value: string;
  condition_type: string;
  condition_value: string;
};

export type CouponDetail = {
  id?: number;
  code: string;
  name: string;
  details: string;
  start_at: string;
  end_at: string;
  rules: CouponRule[];
};

export type Rule = {
  condition_type: string;
  condition_value: string[];
  price_operator?: 'gte' | 'lte';
  benefit_type: string;
  benefit_value: string;
};
