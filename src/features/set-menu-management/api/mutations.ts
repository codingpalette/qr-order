"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import { uploadMenuImage, deleteMenuImage } from "@/shared/api/supabase/storage";

interface SetMenuItemInput {
  master_menu_id: string;
  quantity: number;
  sort_order: number;
}

interface CreateSetMenuInput {
  franchise_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  imageFile?: File | null;
  is_active?: boolean;
  sort_order?: number;
  items: SetMenuItemInput[];
}

interface UpdateSetMenuInput {
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
  items?: SetMenuItemInput[];
}

export function useCreateSetMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSetMenuInput) => {
      const supabase = createClient();

      let image_url: string | null = null;
      if (input.imageFile) {
        image_url = await uploadMenuImage(input.imageFile, input.franchise_id);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: setMenu, error } = await (supabase as any)
        .from("set_menus")
        .insert({
          franchise_id: input.franchise_id,
          category_id: input.category_id,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          cost_price: input.cost_price ?? null,
          image_url,
          is_active: input.is_active ?? true,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      if (input.items.length > 0) {
        const rows = input.items.map((item) => ({
          set_menu_id: (setMenu as { id: string }).id,
          master_menu_id: item.master_menu_id,
          quantity: item.quantity,
          sort_order: item.sort_order,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: itemsError } = await (supabase as any)
          .from("set_menu_items")
          .insert(rows);
        if (itemsError) throw itemsError;
      }

      return setMenu;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-menus"] });
    },
  });
}

export function useUpdateSetMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSetMenuInput) => {
      const supabase = createClient();
      const { id, imageFile, removeImage, currentImageUrl, items, ...updates } = input;

      let image_url: string | null | undefined;
      if (imageFile) {
        if (currentImageUrl) {
          await deleteMenuImage(currentImageUrl).catch(() => {});
        }
        image_url = await uploadMenuImage(imageFile, id);
      } else if (removeImage) {
        if (currentImageUrl) {
          await deleteMenuImage(currentImageUrl).catch(() => {});
        }
        image_url = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("set_menus")
        .update({
          ...updates,
          ...(image_url !== undefined ? { image_url } : {}),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await (supabase as any)
          .from("set_menu_items")
          .delete()
          .eq("set_menu_id", id);
        if (deleteError) throw deleteError;

        if (items.length > 0) {
          const rows = items.map((item) => ({
            set_menu_id: id,
            master_menu_id: item.master_menu_id,
            quantity: item.quantity,
            sort_order: item.sort_order,
          }));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: insertError } = await (supabase as any)
            .from("set_menu_items")
            .insert(rows);
          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-menus"] });
    },
  });
}

export function useDeleteSetMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("set_menus")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-menus"] });
    },
  });
}

export function useReorderSetMenus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const supabase = createClient();
      const promises = items.map((item) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("set_menus")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id),
      );
      const results = await Promise.all(promises);
      const failed = results.find((r: { error?: unknown }) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-menus"] });
    },
  });
}

export function useToggleSetMenuActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("set_menus")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["set-menus"] });
    },
  });
}
