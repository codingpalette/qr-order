"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

interface CallStaffParams {
  storeId: string;
  tableNumber: number;
}

export function useCallStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, tableNumber }: CallStaffParams) => {
      const supabase = createClient();

      // Check for existing pending call
      const { data: existing } = await supabase
        .from("staff_calls")
        .select("id")
        .eq("store_id", storeId)
        .eq("table_number", tableNumber)
        .eq("status", "pending")
        .limit(1);

      if (existing && existing.length > 0) {
        return { alreadyPending: true };
      }

      const { error } = await supabase.from("staff_calls").insert({
        store_id: storeId,
        table_number: tableNumber,
        status: "pending",
      });

      if (error) throw error;
      return { alreadyPending: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-calls"] });
    },
  });
}
