import type { MenuOptionGroup } from "@/entities/menu/model/types";

export interface DisplayMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  menuType: "master" | "local" | "set";
  isSoldOut: boolean;
  sortOrder: number;
  allergens: string[];
  optionGroups: MenuOptionGroup[];
  setMenuItems?: { menuName: string; quantity: number }[];
  originalPrice?: number;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  priceDelta: number;
}

export interface CartItem {
  cartItemId: string;
  menuId: string;
  menuType: "master" | "local" | "set";
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  selectedOptions: SelectedOption[];
}
