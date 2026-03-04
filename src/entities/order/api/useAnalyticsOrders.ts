"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Order, OrderItem } from "../model/types";

export function useAnalyticsOrders(
  storeId: string | null | undefined,
  dateRange: { from: Date; to: Date } | null,
) {
  return useQuery<Order[]>({
    queryKey: [
      "analytics-orders",
      storeId ?? "none",
      dateRange?.from.toISOString() ?? "",
      dateRange?.to.toISOString() ?? "",
    ],
    queryFn: async () => {
      if (!storeId || !dateRange) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .eq("status", "completed")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
    enabled: !!storeId && !!dateRange,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsOrderItems(orderIds: string[]) {
  return useQuery<OrderItem[]>({
    queryKey: ["analytics-order-items", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const supabase = createClient();
      const chunkSize = 100;
      const allItems: OrderItem[] = [];

      for (let i = 0; i < orderIds.length; i += chunkSize) {
        const chunk = orderIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", chunk);
        if (error) throw error;
        allItems.push(...((data ?? []) as unknown as OrderItem[]));
      }

      return allItems;
    },
    enabled: orderIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFranchiseAnalyticsOrders(
  storeIds: string[],
  dateRange: { from: Date; to: Date } | null,
) {
  return useQuery<Order[]>({
    queryKey: [
      "franchise-analytics-orders",
      storeIds,
      dateRange?.from.toISOString() ?? "",
      dateRange?.to.toISOString() ?? "",
    ],
    queryFn: async () => {
      if (storeIds.length === 0 || !dateRange) return [];
      const supabase = createClient();
      const chunkSize = 50;
      const allOrders: Order[] = [];

      for (let i = 0; i < storeIds.length; i += chunkSize) {
        const chunk = storeIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .in("store_id", chunk)
          .eq("status", "completed")
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString())
          .order("created_at", { ascending: true });

        if (error) throw error;
        allOrders.push(...((data ?? []) as unknown as Order[]));
      }

      return allOrders;
    },
    enabled: storeIds.length > 0 && !!dateRange,
    staleTime: 5 * 60 * 1000,
  });
}
