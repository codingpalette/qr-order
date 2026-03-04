"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { MenuCategory } from "../model/types";

export function useMenuCategories(franchiseId?: string | null) {
  return useQuery<MenuCategory[]>({
    queryKey: ["menu-categories", franchiseId ?? "all"],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (franchiseId) {
        query = query.eq("franchise_id", franchiseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MenuCategory[];
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });
}
