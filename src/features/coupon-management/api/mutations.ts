"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

interface CreateCouponInput {
  franchise_id: string;
  store_id?: string | null;
  code: string;
  name: string;
  description?: string | null;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number | null;
  starts_at?: string;
  expires_at?: string | null;
}

interface UpdateCouponInput {
  id: string;
  name?: string;
  description?: string | null;
  discount_type?: "fixed" | "percentage";
  discount_value?: number;
  min_order_amount?: number;
  max_uses?: number | null;
  starts_at?: string;
  expires_at?: string | null;
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("coupons")
        .insert({
          franchise_id: input.franchise_id,
          store_id: input.store_id ?? null,
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          discount_type: input.discount_type,
          discount_value: input.discount_value,
          min_order_amount: input.min_order_amount ?? 0,
          max_uses: input.max_uses ?? null,
          starts_at: input.starts_at ?? new Date().toISOString(),
          expires_at: input.expires_at ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCouponInput) => {
      const supabase = createClient();
      const { id, ...updates } = input;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("coupons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useToggleCouponActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("coupons")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}
