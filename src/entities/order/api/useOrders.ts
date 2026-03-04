"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Order, OrderItem } from "../model/types";
import type { DateRange } from "@/shared/lib/date-utils";

export function useOrders(storeId?: string | null, status?: string | null, dateRange?: DateRange) {
  return useQuery<Order[]>({
    queryKey: ["orders", storeId ?? "all", status ?? "all", dateRange?.from?.toISOString() ?? "none", dateRange?.to?.toISOString() ?? "none"],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (storeId) {
        query = query.eq("store_id", storeId);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (dateRange) {
        query = query.gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
    enabled: !!storeId,
    staleTime: 10 * 1000,
  });
}

export function useOrderItems(orderId?: string | null) {
  return useQuery<OrderItem[]>({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("order_items")
        .select("*, order_item_options(*)")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as OrderItem[];
    },
    enabled: !!orderId,
    staleTime: 30 * 1000,
  });
}

export function useOrderItemsBatch(orderIds: string[]) {
  return useQuery<OrderItem[]>({
    queryKey: ["order-items-batch", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("order_items")
        .select("*, order_item_options(*)")
        .in("order_id", orderIds);
      if (error) throw error;
      return (data ?? []) as unknown as OrderItem[];
    },
    enabled: orderIds.length > 0,
    staleTime: 10 * 1000,
  });
}

export function useTodayOrders(storeId?: string | null) {
  return useQuery<Order[]>({
    queryKey: ["orders", storeId, "today"],
    queryFn: async () => {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId!)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
    enabled: !!storeId,
    staleTime: 10 * 1000,
  });
}
