"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Coupon, CouponValidationResult } from "@/entities/promotion/model/types";

interface ValidateCouponInput {
  code: string;
  storeId: string;
  orderAmount: number;
}

export function useValidateCoupon() {
  return useMutation<CouponValidationResult, Error, ValidateCouponInput>({
    mutationFn: async ({ code, storeId, orderAmount }) => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .limit(1);

      if (error) throw error;

      const coupons = (data ?? []) as unknown as Coupon[];

      if (coupons.length === 0) {
        return { valid: false, coupon: null, discountAmount: 0, errorMessage: "유효하지 않은 쿠폰 코드입니다." };
      }

      const coupon = coupons[0];

      // Store scope check
      if (coupon.store_id && coupon.store_id !== storeId) {
        return { valid: false, coupon: null, discountAmount: 0, errorMessage: "이 매장에서 사용할 수 없는 쿠폰입니다." };
      }

      // Period check
      const now = new Date();
      if (new Date(coupon.starts_at) > now) {
        return { valid: false, coupon: null, discountAmount: 0, errorMessage: "아직 사용 기간이 아닙니다." };
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return { valid: false, coupon: null, discountAmount: 0, errorMessage: "만료된 쿠폰입니다." };
      }

      // Usage limit check
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, coupon: null, discountAmount: 0, errorMessage: "사용 횟수가 초과된 쿠폰입니다." };
      }

      // Minimum order amount check
      if (orderAmount < coupon.min_order_amount) {
        return {
          valid: false,
          coupon: null,
          discountAmount: 0,
          errorMessage: `최소 주문 금액은 ${coupon.min_order_amount.toLocaleString("ko-KR")}원입니다.`,
        };
      }

      // Calculate discount
      let discountAmount: number;
      if (coupon.discount_type === "fixed") {
        discountAmount = coupon.discount_value;
      } else {
        discountAmount = Math.floor(orderAmount * (coupon.discount_value / 100));
      }

      // Discount cannot exceed order amount
      discountAmount = Math.min(discountAmount, orderAmount);

      return { valid: true, coupon, discountAmount, errorMessage: null };
    },
  });
}
