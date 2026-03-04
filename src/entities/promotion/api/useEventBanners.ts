"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { EventBanner } from "../model/types";

export function useEventBanners(franchiseId?: string | null) {
  return useQuery<EventBanner[]>({
    queryKey: ["event-banners", franchiseId ?? "all"],
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("event_banners")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as EventBanner[];
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });
}
