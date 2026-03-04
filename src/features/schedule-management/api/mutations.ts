"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

interface CreateScheduleInput {
  franchise_id: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

interface UpdateScheduleInput {
  id: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
}

export function useCreateMenuSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("menu_schedules")
        .insert({
          franchise_id: input.franchise_id,
          name: input.name,
          start_time: input.start_time,
          end_time: input.end_time,
          days_of_week: input.days_of_week,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-schedules"] });
    },
  });
}

export function useUpdateMenuSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateScheduleInput) => {
      const supabase = createClient();
      const { id, ...updates } = input;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("menu_schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-schedules"] });
    },
  });
}

export function useDeleteMenuSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("menu_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["menu-schedule-links"] });
    },
  });
}

export function useBulkUpdateScheduleLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      links,
    }: {
      scheduleId: string;
      links: { menu_type: "master" | "local"; menu_id: string }[];
    }) => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from("menu_schedule_links")
        .delete()
        .eq("schedule_id", scheduleId);

      if (deleteError) throw deleteError;

      if (links.length > 0) {
        const rows = links.map((l) => ({
          schedule_id: scheduleId,
          menu_type: l.menu_type,
          menu_id: l.menu_id,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from("menu_schedule_links")
          .insert(rows);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-schedule-links"] });
    },
  });
}
