"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

export function useBulkUpdateMasterMenuPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; newPrice: number }[]) => {
      const supabase = createClient();
      const promises = items.map((item) =>
        supabase
          .from("master_menus")
          .update({ price: item.newPrice })
          .eq("id", item.id),
      );
      const results = await Promise.all(promises);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}
