"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { UserProfile } from "../model/types";

export function useFranchiseUsers(franchiseId?: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ["users", "franchise", franchiseId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("franchise_id", franchiseId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as UserProfile[];
    },
    enabled: !!franchiseId,
    staleTime: 60 * 1000,
  });
}

export function useFranchisePendingUsers(franchiseId?: string | null) {
  return useQuery<UserProfile[]>({
    queryKey: ["users", "franchise", franchiseId, "pending"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("franchise_id", franchiseId!)
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as UserProfile[];
    },
    enabled: !!franchiseId,
    staleTime: 30 * 1000,
  });
}
