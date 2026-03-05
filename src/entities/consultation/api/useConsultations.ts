"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Consultation } from "../model/types";

export function useConsultations() {
  return useQuery<Consultation[]>({
    queryKey: ["consultations"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Consultation[];
    },
    staleTime: 30 * 1000,
  });
}
