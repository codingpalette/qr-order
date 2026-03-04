"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import { uploadBannerImage, deleteBannerImage } from "@/shared/api/supabase/storage";

interface CreateBannerInput {
  franchise_id: string;
  store_id?: string | null;
  title: string;
  description?: string | null;
  imageFile?: File | null;
  link_type?: "menu" | "coupon" | "external" | null;
  link_value?: string | null;
  sort_order?: number;
  starts_at?: string;
  ends_at?: string | null;
}

interface UpdateBannerInput {
  id: string;
  title?: string;
  description?: string | null;
  imageFile?: File | null;
  removeImage?: boolean;
  currentImageUrl?: string | null;
  link_type?: "menu" | "coupon" | "external" | null;
  link_value?: string | null;
  starts_at?: string;
  ends_at?: string | null;
}

export function useCreateEventBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBannerInput) => {
      const supabase = createClient();

      let image_url: string | null = null;
      if (input.imageFile) {
        image_url = await uploadBannerImage(input.imageFile, input.franchise_id);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("event_banners")
        .insert({
          franchise_id: input.franchise_id,
          store_id: input.store_id ?? null,
          title: input.title,
          description: input.description ?? null,
          image_url,
          link_type: input.link_type ?? null,
          link_value: input.link_value ?? null,
          sort_order: input.sort_order ?? 0,
          starts_at: input.starts_at ?? new Date().toISOString(),
          ends_at: input.ends_at ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-event-banners"] });
    },
  });
}

export function useUpdateEventBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBannerInput) => {
      const supabase = createClient();
      const { id, imageFile, removeImage, currentImageUrl, ...updates } = input;

      let image_url: string | null | undefined;
      if (imageFile) {
        if (currentImageUrl) await deleteBannerImage(currentImageUrl).catch(() => {});
        image_url = await uploadBannerImage(imageFile, id);
      } else if (removeImage) {
        if (currentImageUrl) await deleteBannerImage(currentImageUrl).catch(() => {});
        image_url = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("event_banners")
        .update({
          ...updates,
          ...(image_url !== undefined ? { image_url } : {}),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-event-banners"] });
    },
  });
}

export function useDeleteEventBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl?: string | null }) => {
      if (imageUrl) await deleteBannerImage(imageUrl).catch(() => {});

      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("event_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-event-banners"] });
    },
  });
}

export function useToggleBannerActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("event_banners")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-event-banners"] });
    },
  });
}

export function useReorderBanners() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const supabase = createClient();
      for (const { id, sort_order } of updates) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("event_banners")
          .update({ sort_order })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-banners"] });
      queryClient.invalidateQueries({ queryKey: ["active-event-banners"] });
    },
  });
}
