"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Store } from "../model/types";

export function useStores(franchiseId?: string | null) {
  return useQuery<Store[]>({
    queryKey: ["stores", franchiseId ?? "all"],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (franchiseId) {
        query = query.eq("franchise_id", franchiseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Store[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
