"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { CouponUsage } from "../model/types";

export function useCouponUsages(couponId?: string | null) {
  return useQuery<CouponUsage[]>({
    queryKey: ["coupon-usages", couponId ?? "all"],
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("coupon_usages")
        .select("*")
        .order("created_at", { ascending: false });

      if (couponId) {
        query = query.eq("coupon_id", couponId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CouponUsage[];
    },
    enabled: !!couponId,
    staleTime: 30 * 1000,
  });
}
