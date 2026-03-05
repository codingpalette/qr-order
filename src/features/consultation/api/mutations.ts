"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { ConsultationStatus } from "@/entities/consultation/model/types";

interface CreateConsultationInput {
  name: string;
  phone: string;
  storeName: string;
  email?: string;
  message?: string;
}

export function useCreateConsultation() {
  return useMutation({
    mutationFn: async (input: CreateConsultationInput) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("consultations")
        .insert({
          name: input.name,
          phone: input.phone,
          store_name: input.storeName,
          email: input.email || null,
          message: input.message || null,
        });

      if (error) throw error;
    },
  });
}

export function useUpdateConsultationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string;
      status: ConsultationStatus;
      note?: string | null;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("consultations")
        .update({ status, note: note ?? null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}
