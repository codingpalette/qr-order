"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Store } from "../model/types";

export function useStore(storeId?: string | null) {
  return useQuery<Store | null>({
    queryKey: ["store", storeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId!)
        .single();

      if (error) throw error;
      return data as unknown as Store;
    },
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
  });
}
