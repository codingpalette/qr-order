"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import {
  uploadFranchiseLogo,
  deleteFranchiseLogo,
} from "@/shared/api/supabase/storage";
import type { Franchise } from "@/entities/franchise/model/types";

interface CreateFranchiseInput {
  name: string;
  logoFile?: File | null;
}

interface UpdateFranchiseInput {
  id: string;
  name?: string;
  logoFile?: File | null;
  removeLogo?: boolean;
  currentLogoUrl?: string | null;
}

export function useCreateFranchise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFranchiseInput) => {
      const supabase = createClient();

      // Create franchise first to get the id
      const { data, error } = await supabase
        .from("franchises")
        .insert({ name: input.name, logo_url: null })
        .select()
        .single();

      if (error) throw error;
      const franchise = data as unknown as Franchise;

      // Upload logo if provided
      if (input.logoFile) {
        const logoUrl = await uploadFranchiseLogo(input.logoFile, franchise.id);
        const { error: updateError } = await supabase
          .from("franchises")
          .update({ logo_url: logoUrl })
          .eq("id", franchise.id);

        if (updateError) throw updateError;
        return { ...franchise, logo_url: logoUrl };
      }

      return franchise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchises"] });
    },
  });
}

export function useUpdateFranchise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFranchiseInput) => {
      const supabase = createClient();
      const { id, logoFile, removeLogo, currentLogoUrl, ...updates } = input;

      let logo_url: string | null | undefined;

      if (logoFile) {
        // Delete old logo if exists
        if (currentLogoUrl) {
          await deleteFranchiseLogo(currentLogoUrl).catch(() => {});
        }
        logo_url = await uploadFranchiseLogo(logoFile, id);
      } else if (removeLogo) {
        if (currentLogoUrl) {
          await deleteFranchiseLogo(currentLogoUrl).catch(() => {});
        }
        logo_url = null;
      }

      const { data, error } = await supabase
        .from("franchises")
        .update({
          ...updates,
          ...(logo_url !== undefined ? { logo_url } : {}),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["franchises"] });
      queryClient.invalidateQueries({
        queryKey: ["franchise", variables.id],
      });
    },
  });
}

export function useToggleFranchiseActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("franchises")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["franchises"] });
      queryClient.invalidateQueries({
        queryKey: ["franchise", variables.id],
      });
    },
  });
}
