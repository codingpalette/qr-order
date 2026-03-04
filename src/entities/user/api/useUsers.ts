"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { UserProfile } from "../model/types";

export function useUsers() {
  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as UserProfile[];
    },
    staleTime: 60 * 1000,
  });
}

export function usePendingUsers() {
  return useQuery<UserProfile[]>({
    queryKey: ["users", "pending"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("is_approved", false)
        .neq("role", "system_admin")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as UserProfile[];
    },
    staleTime: 30 * 1000,
  });
}
