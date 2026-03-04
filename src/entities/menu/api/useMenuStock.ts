"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { MenuStock } from "../model/types";

export function useMenuStock(storeId: string | null) {
  return useQuery<MenuStock[]>({
    queryKey: ["menu-stock", storeId],
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("menu_stock")
        .select("*")
        .eq("store_id", storeId!);
      if (error) throw error;
      return data as MenuStock[];
    },
    enabled: !!storeId,
    staleTime: 60 * 1000,
  });
}
