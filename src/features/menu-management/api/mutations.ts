"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import { uploadMenuImage, deleteMenuImage } from "@/shared/api/supabase/storage";

// ── Category Mutations ──

interface CreateCategoryInput {
  franchise_id: string;
  name: string;
  sort_order?: number;
}

interface UpdateCategoryInput {
  id: string;
  name?: string;
  sort_order?: number;
}

export function useCreateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_categories")
        .insert({
          franchise_id: input.franchise_id,
          name: input.name,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
    },
  });
}

export function useUpdateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => {
      const supabase = createClient();
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("menu_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
    },
  });
}

export function useDeleteMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}

// ── Master Menu Mutations ──

interface CreateMasterMenuInput {
  franchise_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  imageFile?: File | null;
  sort_order?: number;
}

interface UpdateMasterMenuInput {
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

export function useCreateMasterMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMasterMenuInput) => {
      const supabase = createClient();

      let image_url: string | null = null;
      if (input.imageFile) {
        image_url = await uploadMenuImage(input.imageFile, input.franchise_id);
      }

      const { data, error } = await supabase
        .from("master_menus")
        .insert({
          franchise_id: input.franchise_id,
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
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}

export function useUpdateMasterMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMasterMenuInput) => {
      const supabase = createClient();
      const { id, imageFile, removeImage, currentImageUrl, ...updates } = input;

      let image_url: string | null | undefined;

      if (imageFile) {
        if (currentImageUrl) {
          await deleteMenuImage(currentImageUrl).catch(() => {});
        }
        image_url = await uploadMenuImage(imageFile, input.category_id ?? id);
      } else if (removeImage) {
        if (currentImageUrl) {
          await deleteMenuImage(currentImageUrl).catch(() => {});
        }
        image_url = null;
      }

      const { data, error } = await supabase
        .from("master_menus")
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
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}

export function useDeleteMasterMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("master_menus")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}

export function useReorderMasterMenus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const supabase = createClient();
      const promises = items.map((item) =>
        supabase
          .from("master_menus")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id),
      );
      const results = await Promise.all(promises);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}

export function useToggleMasterMenuActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("master_menus")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-menus"] });
    },
  });
}
