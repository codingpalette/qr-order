"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ store_id, table_number }: { store_id: string; table_number: number }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .insert({ store_id, table_number })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useResetTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .update({ current_session_id: crypto.randomUUID() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useResetTableByNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, tableNumber }: { storeId: string; tableNumber: number }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .update({ current_session_id: crypto.randomUUID() })
        .eq("store_id", storeId)
        .eq("table_number", tableNumber)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useUpdateTableQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, qr_code_url }: { id: string; qr_code_url: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .update({ qr_code_url })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}
