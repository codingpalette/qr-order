"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

export interface StaffCall {
  id: string;
  store_id: string;
  table_number: number;
  status: string;
  created_at: string;
}

export function useStaffCalls(storeId: string | null) {
  return useQuery<StaffCall[]>({
    queryKey: ["staff-calls", storeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("staff_calls")
        .select("*")
        .eq("store_id", storeId!)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StaffCall[];
    },
    enabled: !!storeId,
    staleTime: 10 * 1000,
  });
}
