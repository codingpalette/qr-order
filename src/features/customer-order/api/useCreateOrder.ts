"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Order } from "@/entities/order/model/types";
import type { CartItem } from "../model/types";

interface CreateOrderParams {
  storeId: string;
  tableNumber: number;
  items: CartItem[];
  totalAmount: number;
  memo?: string;
  sessionId?: string;
  couponId?: string;
  discountAmount?: number;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      tableNumber,
      items,
      totalAmount,
      memo,
      sessionId,
      couponId,
      discountAmount,
    }: CreateOrderParams) => {
      const supabase = createClient();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: storeId,
          table_number: tableNumber,
          status: "pending",
          total_amount: totalAmount,
          memo: memo || null,
          session_id: sessionId ?? null,
          coupon_id: couponId ?? null,
          discount_amount: discountAmount ?? 0,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      const typedOrder = order as unknown as Order;

      const orderItems = items.map((item) => {
        const optionTotal = item.selectedOptions.reduce(
          (s, o) => s + o.priceDelta,
          0,
        );
        return {
          order_id: typedOrder.id,
          menu_type: item.menuType,
          menu_id: item.menuId,
          menu_name: item.name,
          quantity: item.quantity,
          unit_price: item.price + optionTotal,
          total_price: (item.price + optionTotal) * item.quantity,
        };
      });

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select("id");

      if (itemsError) throw itemsError;

      // Insert order item options
      const optionRows: {
        order_item_id: string;
        option_group_name: string;
        option_item_name: string;
        price_delta: number;
      }[] = [];

      items.forEach((item, idx) => {
        const orderItemId = (insertedItems as unknown as { id: string }[])[idx]
          ?.id;
        if (!orderItemId) return;
        item.selectedOptions.forEach((opt) => {
          optionRows.push({
            order_item_id: orderItemId,
            option_group_name: opt.groupName,
            option_item_name: opt.itemName,
            price_delta: opt.priceDelta,
          });
        });
      });

      if (optionRows.length > 0) {
        const { error: optError } = await supabase
          .from("order_item_options")
          .insert(optionRows);
        if (optError) throw optError;
      }

      // Apply coupon if provided
      if (couponId && discountAmount) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc("apply_coupon", {
          p_coupon_id: couponId,
          p_order_id: typedOrder.id,
          p_store_id: storeId,
          p_discount_amount: discountAmount,
        });
      }

      // Decrement stock for each item
      for (const item of items) {
        if (item.menuType === "set") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc("decrement_stock", {
          p_store_id: storeId,
          p_menu_type: item.menuType,
          p_menu_id: item.menuId,
          p_quantity: item.quantity,
        });
      }

      return typedOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["menu-stock"] });
      queryClient.invalidateQueries({ queryKey: ["store-menu-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["local-menus"] });
    },
  });
}
