import type {
  Order,
  OrderItem,
  AnalyticsPeriod,
  SalesDataPoint,
  MenuRankingItem,
  HourlyDataPoint,
  TableRevenueItem,
  StoreComparisonItem,
} from "../model/types";

function getWeekLabel(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const week = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDayLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getPeriodKey(date: Date, period: AnalyticsPeriod): string {
  switch (period) {
    case "daily":
      return date.toISOString().split("T")[0];
    case "weekly":
      return getWeekLabel(date);
    case "monthly":
      return getMonthLabel(date);
  }
}

function getPeriodLabel(date: Date, period: AnalyticsPeriod): string {
  switch (period) {
    case "daily":
      return getDayLabel(date);
    case "weekly":
      return getWeekLabel(date);
    case "monthly": {
      const m = date.getMonth() + 1;
      return `${m}월`;
    }
  }
}

export function aggregateSalesByPeriod(
  orders: Order[],
  period: AnalyticsPeriod,
): SalesDataPoint[] {
  const map = new Map<string, { label: string; date: string; totalSales: number; orderCount: number }>();

  for (const order of orders) {
    const date = new Date(order.created_at);
    const key = getPeriodKey(date, period);

    const existing = map.get(key);
    if (existing) {
      existing.totalSales += order.total_amount;
      existing.orderCount += 1;
    } else {
      map.set(key, {
        label: getPeriodLabel(date, period),
        date: key,
        totalSales: order.total_amount,
        orderCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateMenuRanking(
  items: OrderItem[],
  sortBy: "quantity" | "revenue" = "quantity",
): MenuRankingItem[] {
  const map = new Map<string, MenuRankingItem>();

  for (const item of items) {
    const key = `${item.menu_type}:${item.menu_id}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += item.total_price;
    } else {
      map.set(key, {
        menuId: item.menu_id,
        menuName: item.menu_name,
        menuType: item.menu_type,
        totalQuantity: item.quantity,
        totalRevenue: item.total_price,
      });
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) =>
    sortBy === "quantity"
      ? b.totalQuantity - a.totalQuantity
      : b.totalRevenue - a.totalRevenue,
  );
  return result;
}

export function aggregateByHour(orders: Order[]): HourlyDataPoint[] {
  const hours: HourlyDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    orderCount: 0,
    totalSales: 0,
  }));

  for (const order of orders) {
    const hour = new Date(order.created_at).getHours();
    hours[hour].orderCount += 1;
    hours[hour].totalSales += order.total_amount;
  }

  return hours;
}

export function aggregateByTable(orders: Order[]): TableRevenueItem[] {
  const map = new Map<number, { orderCount: number; totalSales: number }>();

  for (const order of orders) {
    const existing = map.get(order.table_number);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSales += order.total_amount;
    } else {
      map.set(order.table_number, {
        orderCount: 1,
        totalSales: order.total_amount,
      });
    }
  }

  return Array.from(map.entries())
    .map(([tableNumber, data]) => ({
      tableNumber,
      orderCount: data.orderCount,
      totalSales: data.totalSales,
      averageSpend: data.orderCount > 0 ? data.totalSales / data.orderCount : 0,
    }))
    .sort((a, b) => a.tableNumber - b.tableNumber);
}

export function aggregateByStore(
  orders: Order[],
  storeMap: Map<string, string>,
): StoreComparisonItem[] {
  const map = new Map<string, { totalSales: number; orderCount: number }>();

  for (const order of orders) {
    const existing = map.get(order.store_id);
    if (existing) {
      existing.totalSales += order.total_amount;
      existing.orderCount += 1;
    } else {
      map.set(order.store_id, {
        totalSales: order.total_amount,
        orderCount: 1,
      });
    }
  }

  return Array.from(map.entries())
    .map(([storeId, data]) => ({
      storeId,
      storeName: storeMap.get(storeId) ?? storeId,
      totalSales: data.totalSales,
      orderCount: data.orderCount,
      averageOrderValue: data.orderCount > 0 ? data.totalSales / data.orderCount : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}
