"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { MasterMenu } from "../model/types";

export function useMasterMenus(franchiseId?: string | null, categoryId?: string | null) {
  return useQuery<MasterMenu[]>({
    queryKey: ["master-menus", franchiseId ?? "all", categoryId ?? "all"],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("master_menus")
        .select("*")
        .order("sort_order", { ascending: true });

      if (franchiseId) {
        query = query.eq("franchise_id", franchiseId);
      }
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MasterMenu[];
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });
}
