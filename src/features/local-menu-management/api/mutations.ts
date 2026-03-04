"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import { uploadMenuImage, deleteMenuImage } from "@/shared/api/supabase/storage";

interface CreateLocalMenuInput {
  store_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  imageFile?: File | null;
  sort_order?: number;
}

interface UpdateLocalMenuInput {
  id: string;
  category_id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  cost_price?: number | null;
  imageFile?: File | null;
  removeImage?: boolean;
  currentImageUrl?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export function useCreateLocalMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLocalMenuInput) => {
      const supabase = createClient();

      let image_url: string | null = null;
      if (input.imageFile) {
        image_url = await uploadMenuImage(input.imageFile, input.store_id);
      }

      const { data, error } = await supabase
        .from("local_menus")
        .insert({
          store_id: input.store_id,
          category_id: input.category_id,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          cost_price: input.cost_price ?? null,
          image_url,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-menus"] });
    },
  });
}

export function useUpdateLocalMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLocalMenuInput) => {
      const supabase = createClient();
      const { id, imageFile, removeImage, currentImageUrl, ...updates } = input;

      let image_url: string | null | undefined;
      if (imageFile) {
        if (currentImageUrl) await deleteMenuImage(currentImageUrl).catch(() => {});
        image_url = await uploadMenuImage(imageFile, id);
      } else if (removeImage) {
        if (currentImageUrl) await deleteMenuImage(currentImageUrl).catch(() => {});
        image_url = null;
      }

      const { data, error } = await supabase
        .from("local_menus")
        .update({ ...updates, ...(image_url !== undefined ? { image_url } : {}) })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-menus"] });
    },
  });
}

export function useDeleteLocalMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("local_menus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-menus"] });
    },
  });
}

export function useToggleLocalMenuActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("local_menus")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-menus"] });
    },
  });
}

// ── Store Menu Overrides (master menu sold-out/hidden) ──

export function useUpsertMenuOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      master_menu_id: string;
      is_sold_out?: boolean;
      is_hidden?: boolean;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("store_menu_overrides")
        .upsert(
          {
            store_id: input.store_id,
            master_menu_id: input.master_menu_id,
            is_sold_out: input.is_sold_out ?? false,
            is_hidden: input.is_hidden ?? false,
          },
          { onConflict: "store_id,master_menu_id" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-menu-overrides"] });
    },
  });
}

export function useReorderMasterMenuOverrides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      items: { master_menu_id: string; sort_order: number }[];
    }) => {
      const supabase = createClient();
      const promises = input.items.map((item) =>
        supabase
          .from("store_menu_overrides")
          .upsert(
            {
              store_id: input.store_id,
              master_menu_id: item.master_menu_id,
              sort_order: item.sort_order,
            },
            { onConflict: "store_id,master_menu_id" },
          ),
      );
      const results = await Promise.all(promises);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-menu-overrides"] });
    },
  });
}

export function useReorderLocalMenus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const supabase = createClient();
      const promises = items.map((item) =>
        supabase
          .from("local_menus")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id),
      );
      const results = await Promise.all(promises);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-menus"] });
    },
  });
}
