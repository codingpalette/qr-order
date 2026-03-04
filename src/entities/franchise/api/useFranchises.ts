"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Franchise } from "../model/types";

export function useFranchises() {
  return useQuery<Franchise[]>({
    queryKey: ["franchises"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("franchises")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Franchise[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useFranchise(id: string | null) {
  return useQuery<Franchise | null>({
    queryKey: ["franchise", id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("franchises")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Franchise;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}
