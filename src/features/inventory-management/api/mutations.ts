"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

interface UpsertMenuStockInput {
  store_id: string;
  menu_type: "master" | "local";
  menu_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

export function useUpsertMenuStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertMenuStockInput) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("menu_stock")
        .upsert(
          {
            store_id: input.store_id,
            menu_type: input.menu_type,
            menu_id: input.menu_id,
            stock_quantity: input.stock_quantity,
            low_stock_threshold: input.low_stock_threshold,
          },
          { onConflict: "store_id,menu_type,menu_id" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-stock"] });
    },
  });
}

export function useDeleteMenuStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("menu_stock")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-stock"] });
    },
  });
}
