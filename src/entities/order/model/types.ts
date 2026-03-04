export type OrderStatus = "pending" | "confirmed" | "preparing" | "completed" | "cancelled";

export interface Order {
  id: string;
  store_id: string;
  table_number: number;
  status: OrderStatus;
  total_amount: number;
  coupon_id: string | null;
  discount_amount: number;
  cancel_reason: string | null;
  memo: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemOption {
  id: string;
  order_item_id: string;
  option_group_name: string;
  option_item_name: string;
  price_delta: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_type: "master" | "local";
  menu_id: string;
  menu_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  order_item_options?: OrderItemOption[];
}

export interface StoreMenuOverride {
  id: string;
  store_id: string;
  master_menu_id: string;
  is_sold_out: boolean;
  is_hidden: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

// --- Analytics Types ---

export type AnalyticsPeriod = "daily" | "weekly" | "monthly";

export interface SalesDataPoint {
  label: string;
  date: string;
  totalSales: number;
  orderCount: number;
}

export interface MenuRankingItem {
  menuId: string;
  menuName: string;
  menuType: "master" | "local";
  totalQuantity: number;
  totalRevenue: number;
}

export interface HourlyDataPoint {
  hour: number;
  orderCount: number;
  totalSales: number;
}

export interface TableRevenueItem {
  tableNumber: number;
  orderCount: number;
  totalSales: number;
  averageSpend: number;
}

export interface StoreComparisonItem {
  storeId: string;
  storeName: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}
