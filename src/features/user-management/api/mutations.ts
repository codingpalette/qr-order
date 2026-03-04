"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { UserRole } from "@/entities/user/model/types";

interface ApproveUserInput {
  userId: string;
  role: Exclude<UserRole, "pending">;
  franchiseId?: string | null;
  storeId?: string | null;
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApproveUserInput) => {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          role: input.role,
          franchise_id: input.franchiseId ?? null,
          store_id: input.storeId ?? null,
          is_approved: true,
          approved_by: currentUser?.id ?? null,
        })
        .eq("id", input.userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient();
      // Delete the profile — the auth.users row remains but user cannot access the system
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
      franchiseId,
      storeId,
    }: {
      userId: string;
      role: UserRole;
      franchiseId?: string | null;
      storeId?: string | null;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          role,
          franchise_id: franchiseId ?? null,
          store_id: storeId ?? null,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
