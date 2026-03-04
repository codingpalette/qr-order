"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

interface CreateStoreInput {
  franchise_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

interface UpdateStoreInput {
  id: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
  pg_merchant_key?: string | null;
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStoreInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stores")
        .insert({
          franchise_id: input.franchise_id,
          name: input.name,
          address: input.address ?? null,
          phone: input.phone ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStoreInput) => {
      const supabase = createClient();
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("stores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useToggleStoreActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stores")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
