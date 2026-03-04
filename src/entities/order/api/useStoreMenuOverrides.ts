"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { StoreMenuOverride } from "../model/types";

export function useStoreMenuOverrides(storeId?: string | null) {
  return useQuery<StoreMenuOverride[]>({
    queryKey: ["store-menu-overrides", storeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("store_menu_overrides")
        .select("*")
        .eq("store_id", storeId!);

      if (error) throw error;
      return (data ?? []) as unknown as StoreMenuOverride[];
    },
    enabled: !!storeId,
    staleTime: 60 * 1000,
  });
}
