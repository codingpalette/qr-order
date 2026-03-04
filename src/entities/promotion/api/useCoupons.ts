"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Coupon } from "../model/types";

export function useCoupons(franchiseId?: string | null) {
  return useQuery<Coupon[]>({
    queryKey: ["coupons", franchiseId ?? "all"],
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("coupons")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Coupon[];
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });
}
