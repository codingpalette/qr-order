"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Order, OrderItem } from "@/entities/order/model/types";

export interface TableOrderWithItems extends Order {
  items: OrderItem[];
}

export function useTableOrders(storeId: string, tableNumber: number, sessionId?: string | null) {
  return useQuery<TableOrderWithItems[]>({
    queryKey: ["table-orders", storeId, tableNumber, sessionId],
    queryFn: async () => {
      const supabase = createClient();

      let query = supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .eq("table_number", tableNumber);

      if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", today.toISOString());
      }

      const { data: orders, error: ordersError } = await query
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const orderIds = (orders as unknown as Order[]).map((o) => o.id);
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      const itemsByOrder = new Map<string, OrderItem[]>();
      (items as unknown as OrderItem[])?.forEach((item) => {
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        itemsByOrder.set(item.order_id, list);
      });

      return (orders as unknown as Order[]).map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
      }));
    },
    staleTime: 10 * 1000,
  });
}
