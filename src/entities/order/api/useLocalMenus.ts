"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { LocalMenu } from "@/entities/menu/model/types";

export function useLocalMenus(storeId?: string | null) {
  return useQuery<LocalMenu[]>({
    queryKey: ["local-menus", storeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("local_menus")
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as LocalMenu[];
    },
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
  });
}
