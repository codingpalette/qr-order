"use client";

import { useMemo } from "react";
import { useStore } from "@/entities/store/api/useStore";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useMenuOptions } from "@/entities/menu/api/useMenuOptions";
import { useLocalMenus } from "@/entities/order/api/useLocalMenus";
import { useStoreMenuOverrides } from "@/entities/order/api/useStoreMenuOverrides";
import { useMenuSchedules } from "@/entities/menu/api/useMenuSchedules";
import { useSetMenus } from "@/entities/menu/api/useSetMenus";
import type { DisplayMenuItem } from "../model/types";
import type { MenuSchedule } from "@/entities/menu/model/types";

function isMenuAvailableNow(schedules: MenuSchedule[]): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return schedules.some((schedule) => {
    if (!schedule.days_of_week.includes(currentDay)) return false;
    const start = schedule.start_time.slice(0, 5);
    const end = schedule.end_time.slice(0, 5);
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    }
    // Overnight schedule (e.g., 22:00 ~ 02:00)
    return currentTime >= start || currentTime <= end;
  });
}

export function useComposedMenuList(storeId: string) {
  const { data: store, isLoading: storeLoading } = useStore(storeId);
  const franchiseId = store?.franchise_id ?? null;

  const { data: masterMenus, isLoading: masterLoading } =
    useMasterMenus(franchiseId);
  const { data: categories, isLoading: categoriesLoading } =
    useMenuCategories(franchiseId);
  const { data: localMenus, isLoading: localLoading } = useLocalMenus(storeId);
  const { data: overrides, isLoading: overridesLoading } =
    useStoreMenuOverrides(storeId);
  const { data: optionsData, isLoading: optionsLoading } =
    useMenuOptions(franchiseId);
  const { linksByMenu: scheduleLinksByMenu, isLoading: schedulesLoading } =
    useMenuSchedules(franchiseId);
  const { data: setMenusData, isLoading: setMenusLoading } =
    useSetMenus(franchiseId);

  const isLoading =
    storeLoading ||
    masterLoading ||
    categoriesLoading ||
    localLoading ||
    overridesLoading ||
    optionsLoading ||
    schedulesLoading ||
    setMenusLoading;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const overrideMap = useMemo(() => {
    const map = new Map<
      string,
      { isSoldOut: boolean; isHidden: boolean; sortOrder: number | null }
    >();
    overrides?.forEach((o) =>
      map.set(o.master_menu_id, {
        isSoldOut: o.is_sold_out,
        isHidden: o.is_hidden,
        sortOrder: o.sort_order,
      }),
    );
    return map;
  }, [overrides]);

  const linksByMenu = optionsData?.linksByMenu ?? new Map();

  const menuItems: DisplayMenuItem[] = useMemo(() => {
    const items: DisplayMenuItem[] = [];

    masterMenus?.forEach((menu) => {
      if (!menu.is_active) return;
      const override = overrideMap.get(menu.id);
      if (override?.isHidden) return;

      // Schedule filtering
      const menuSchedules = scheduleLinksByMenu.get(`master:${menu.id}`);
      if (menuSchedules && menuSchedules.length > 0 && !isMenuAvailableNow(menuSchedules)) {
        return;
      }

      items.push({
        id: menu.id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        imageUrl: menu.image_url,
        categoryId: menu.category_id,
        categoryName: categoryMap.get(menu.category_id) ?? "기타",
        menuType: "master",
        isSoldOut: override?.isSoldOut ?? false,
        sortOrder: override?.sortOrder ?? menu.sort_order,
        allergens: (menu as unknown as { allergens?: string[] }).allergens ?? [],
        optionGroups: linksByMenu.get(`master:${menu.id}`) ?? [],
      });
    });

    localMenus?.forEach((menu) => {
      // Schedule filtering
      const menuSchedules = scheduleLinksByMenu.get(`local:${menu.id}`);
      if (menuSchedules && menuSchedules.length > 0 && !isMenuAvailableNow(menuSchedules)) {
        return;
      }

      items.push({
        id: menu.id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        imageUrl: menu.image_url,
        categoryId: menu.category_id,
        categoryName: categoryMap.get(menu.category_id) ?? "자체 메뉴",
        menuType: "local",
        isSoldOut: !menu.is_active,
        sortOrder: menu.sort_order,
        allergens: (menu as unknown as { allergens?: string[] }).allergens ?? [],
        optionGroups: linksByMenu.get(`local:${menu.id}`) ?? [],
      });
    });

    // Set menus
    setMenusData?.forEach((setMenu) => {
      if (!setMenu.is_active) return;
      items.push({
        id: setMenu.id,
        name: setMenu.name,
        description: setMenu.description,
        price: setMenu.price,
        imageUrl: setMenu.image_url,
        categoryId: setMenu.category_id,
        categoryName: categoryMap.get(setMenu.category_id) ?? "세트 메뉴",
        menuType: "set",
        isSoldOut: false,
        sortOrder: setMenu.sort_order,
        allergens: [],
        optionGroups: [],
        setMenuItems: setMenu.items.map((i) => ({
          menuName: i.menu_name,
          quantity: i.quantity,
        })),
        originalPrice: setMenu.original_price,
      });
    });

    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  }, [masterMenus, localMenus, overrideMap, categoryMap, linksByMenu, scheduleLinksByMenu, setMenusData]);

  const categoryList = useMemo(() => {
    if (!categories) return [];
    const activeCategoryIds = new Set(menuItems.map((m) => m.categoryId));
    return categories
      .filter((c) => activeCategoryIds.has(c.id))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, menuItems]);

  return { menuItems, categoryList, store, isLoading };
}
