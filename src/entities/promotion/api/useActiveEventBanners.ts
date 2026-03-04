"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { EventBanner } from "../model/types";

export function useActiveEventBanners(storeId?: string | null) {
  return useQuery<EventBanner[]>({
    queryKey: ["active-event-banners", storeId ?? "none"],
    queryFn: async () => {
      const supabase = createClient();
      const now = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("event_banners")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("sort_order", { ascending: true });

      // Store-scoped: banners for this store OR franchise-wide (store_id IS NULL)
      if (storeId) {
        query = query.or(`store_id.eq.${storeId},store_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Client-side filter for ends_at (since .or() with nullable is tricky)
      const banners = (data ?? []) as unknown as EventBanner[];
      return banners.filter(
        (b) => !b.ends_at || new Date(b.ends_at) > new Date(),
      );
    },
    enabled: !!storeId,
    staleTime: 60 * 1000,
  });
}
