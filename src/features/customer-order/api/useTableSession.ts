"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

export function useTableSession(storeId: string, tableNumber: number) {
  return useQuery<string | null>({
    queryKey: ["table-session", storeId, tableNumber],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .select("current_session_id")
        .eq("store_id", storeId)
        .eq("table_number", tableNumber)
        .single();

      if (error) return null;
      return (data as { current_session_id: string }).current_session_id;
    },
    staleTime: 30 * 1000,
  });
}
