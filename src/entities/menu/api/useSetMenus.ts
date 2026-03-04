"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { SetMenuWithItems } from "../model/types";

export function useSetMenus(franchiseId: string | null) {
  return useQuery<SetMenuWithItems[]>({
    queryKey: ["set-menus", franchiseId],
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("set_menus")
        .select("*, set_menu_items(*, master_menus(name, price))")
        .eq("franchise_id", franchiseId!)
        .order("sort_order");

      if (error) throw error;

      return (data as unknown[]).map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const items = ((r.set_menu_items as unknown[]) ?? []).map((item: unknown) => {
          const i = item as Record<string, unknown>;
          const masterMenu = i.master_menus as Record<string, unknown>;
          return {
            id: i.id as string,
            set_menu_id: i.set_menu_id as string,
            master_menu_id: i.master_menu_id as string,
            quantity: i.quantity as number,
            sort_order: i.sort_order as number,
            menu_name: (masterMenu?.name as string) ?? "",
            menu_price: (masterMenu?.price as number) ?? 0,
          };
        });

        const original_price = items.reduce(
          (sum, item) => sum + item.menu_price * item.quantity,
          0,
        );

        return {
          id: r.id as string,
          franchise_id: r.franchise_id as string,
          category_id: r.category_id as string,
          name: r.name as string,
          description: r.description as string | null,
          price: r.price as number,
          image_url: r.image_url as string | null,
          is_active: r.is_active as boolean,
          sort_order: r.sort_order as number,
          cost_price: r.cost_price as number | null,
          created_at: r.created_at as string,
          updated_at: r.updated_at as string,
          items,
          original_price,
        } satisfies SetMenuWithItems;
      });
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });
}
