"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { MenuOptionGroup, MenuOptionItem } from "../model/types";

interface RawOptionGroup {
  id: string;
  franchise_id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
}

interface RawOptionItem {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number;
  is_active: boolean;
  sort_order: number;
}

interface RawGroupLink {
  menu_type: string;
  menu_id: string;
  option_group_id: string;
  sort_order: number;
}

export function useMenuOptions(franchiseId?: string | null) {
  return useQuery<{
    groups: MenuOptionGroup[];
    linksByMenu: Map<string, MenuOptionGroup[]>;
  }>({
    queryKey: ["menu-options", franchiseId ?? "none"],
    queryFn: async () => {
      const supabase = createClient();

      const [groupsRes, itemsRes, linksRes] = await Promise.all([
        supabase
          .from("menu_option_groups")
          .select("*")
          .eq("franchise_id", franchiseId!)
          .order("sort_order"),
        supabase
          .from("menu_option_items")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("menu_option_group_links")
          .select("*")
          .order("sort_order"),
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (linksRes.error) throw linksRes.error;

      const rawGroups = (groupsRes.data ?? []) as unknown as RawOptionGroup[];
      const rawItems = (itemsRes.data ?? []) as unknown as RawOptionItem[];
      const rawLinks = (linksRes.data ?? []) as unknown as RawGroupLink[];

      // Build items by group
      const itemsByGroup = new Map<string, MenuOptionItem[]>();
      rawItems.forEach((item) => {
        const list = itemsByGroup.get(item.option_group_id) ?? [];
        list.push(item);
        itemsByGroup.set(item.option_group_id, list);
      });

      // Build full groups
      const groupMap = new Map<string, MenuOptionGroup>();
      rawGroups.forEach((g) => {
        groupMap.set(g.id, {
          ...g,
          items: itemsByGroup.get(g.id) ?? [],
        });
      });

      // Build linksByMenu: key = "master:menuId" or "local:menuId"
      const linksByMenu = new Map<string, MenuOptionGroup[]>();
      rawLinks.forEach((link) => {
        const key = `${link.menu_type}:${link.menu_id}`;
        const group = groupMap.get(link.option_group_id);
        if (!group) return;
        const list = linksByMenu.get(key) ?? [];
        list.push(group);
        linksByMenu.set(key, list);
      });

      return { groups: Array.from(groupMap.values()), linksByMenu };
    },
    enabled: !!franchiseId,
    staleTime: 2 * 60 * 1000,
  });
}
