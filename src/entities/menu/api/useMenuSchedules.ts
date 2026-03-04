"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/shared/api/supabase/client";
import type { MenuSchedule, MenuScheduleLink } from "../model/types";

export function useMenuSchedules(franchiseId: string | null) {
  const schedulesQuery = useQuery<MenuSchedule[]>({
    queryKey: ["menu-schedules", franchiseId],
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("menu_schedules")
        .select("*")
        .eq("franchise_id", franchiseId!)
        .order("created_at");
      if (error) throw error;
      return data as MenuSchedule[];
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });

  const linksQuery = useQuery<MenuScheduleLink[]>({
    queryKey: ["menu-schedule-links", franchiseId],
    queryFn: async () => {
      const supabase = createClient();
      const scheduleIds = schedulesQuery.data?.map((s) => s.id) ?? [];
      if (scheduleIds.length === 0) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("menu_schedule_links")
        .select("*")
        .in("schedule_id", scheduleIds);
      if (error) throw error;
      return data as MenuScheduleLink[];
    },
    enabled: !!franchiseId && (schedulesQuery.data?.length ?? 0) > 0,
    staleTime: 2 * 60 * 1000,
  });

  const linksByMenu = useMemo(() => {
    const map = new Map<string, MenuSchedule[]>();
    const links = linksQuery.data ?? [];
    const schedules = schedulesQuery.data ?? [];
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

    links.forEach((link) => {
      const key = `${link.menu_type}:${link.menu_id}`;
      const schedule = scheduleMap.get(link.schedule_id);
      if (!schedule) return;
      const existing = map.get(key) ?? [];
      existing.push(schedule);
      map.set(key, existing);
    });

    return map;
  }, [linksQuery.data, schedulesQuery.data]);

  return {
    schedules: schedulesQuery.data ?? [],
    links: linksQuery.data ?? [],
    linksByMenu,
    isLoading: schedulesQuery.isLoading || linksQuery.isLoading,
  };
}
