"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";

// ── Option Group Mutations ──

interface CreateOptionGroupInput {
  franchise_id: string;
  name: string;
  is_required?: boolean;
  min_select?: number;
  max_select?: number;
  sort_order?: number;
}

interface UpdateOptionGroupInput {
  id: string;
  name?: string;
  is_required?: boolean;
  min_select?: number;
  max_select?: number;
  sort_order?: number;
}

export function useCreateOptionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOptionGroupInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_option_groups")
        .insert({
          franchise_id: input.franchise_id,
          name: input.name,
          is_required: input.is_required ?? false,
          min_select: input.min_select ?? 0,
          max_select: input.max_select ?? 1,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

export function useUpdateOptionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOptionGroupInput) => {
      const supabase = createClient();
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("menu_option_groups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

export function useDeleteOptionGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_option_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

// ── Option Item Mutations ──

interface CreateOptionItemInput {
  option_group_id: string;
  name: string;
  price_delta?: number;
  sort_order?: number;
}

interface UpdateOptionItemInput {
  id: string;
  name?: string;
  price_delta?: number;
  is_active?: boolean;
  sort_order?: number;
}

export function useCreateOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOptionItemInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_option_items")
        .insert({
          option_group_id: input.option_group_id,
          name: input.name,
          price_delta: input.price_delta ?? 0,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

export function useUpdateOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOptionItemInput) => {
      const supabase = createClient();
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("menu_option_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

export function useDeleteOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_option_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

export function useToggleOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_option_items")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

// ── Option Group Link Mutations ──

interface CreateOptionGroupLinkInput {
  menu_type: "master" | "local";
  menu_id: string;
  option_group_id: string;
  sort_order?: number;
}

export function useCreateOptionGroupLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOptionGroupLinkInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_option_group_links")
        .insert({
          menu_type: input.menu_type,
          menu_id: input.menu_id,
          option_group_id: input.option_group_id,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}

export function useDeleteOptionGroupLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("menu_option_group_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-options"] });
    },
  });
}
