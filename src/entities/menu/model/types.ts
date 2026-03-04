export interface MasterMenu {
  id: string;
  franchise_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface LocalMenu {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  franchise_id: string;
  name: string;
  sort_order: number;
}

export interface MenuOptionGroup {
  id: string;
  franchise_id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  items: MenuOptionItem[];
}

export interface MenuOptionItem {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number;
  is_active: boolean;
  sort_order: number;
}

export interface MenuSchedule {
  id: string;
  franchise_id: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  created_at: string;
  updated_at: string;
}

export interface MenuScheduleLink {
  id: string;
  schedule_id: string;
  menu_type: "master" | "local";
  menu_id: string;
}

export interface MenuStock {
  id: string;
  store_id: string;
  menu_type: "master" | "local";
  menu_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface SetMenu {
  id: string;
  franchise_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface SetMenuItem {
  id: string;
  set_menu_id: string;
  master_menu_id: string;
  quantity: number;
  sort_order: number;
}

export interface SetMenuWithItems extends SetMenu {
  items: (SetMenuItem & { menu_name: string; menu_price: number })[];
  original_price: number;
}
