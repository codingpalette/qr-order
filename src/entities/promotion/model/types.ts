export interface Coupon {
  id: string;
  franchise_id: string;
  store_id: string | null;
  code: string;
  name: string;
  description: string | null;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  store_id: string;
  discount_amount: number;
  created_at: string;
}

export interface EventBanner {
  id: string;
  franchise_id: string;
  store_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  link_type: "menu" | "coupon" | "external" | null;
  link_value: string | null;
  sort_order: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon: Coupon | null;
  discountAmount: number;
  errorMessage: string | null;
}
