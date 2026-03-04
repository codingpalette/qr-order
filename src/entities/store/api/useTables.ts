"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Table } from "../model/types";

export function useTables(storeId?: string | null) {
  return useQuery<Table[]>({
    queryKey: ["tables", storeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("store_id", storeId!)
        .order("table_number", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as Table[];
    },
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
  });
}
