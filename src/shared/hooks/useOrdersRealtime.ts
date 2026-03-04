"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { Order } from "@/entities/order/model/types";

interface UseOrdersRealtimeOptions {
  storeId: string | null;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
}

export function useOrdersRealtime({
  storeId,
  onNewOrder,
  onOrderUpdate,
}: UseOrdersRealtimeOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const onNewOrderRef = useRef(onNewOrder);
  const onOrderUpdateRef = useRef(onOrderUpdate);

  onNewOrderRef.current = onNewOrder;
  onOrderUpdateRef.current = onOrderUpdate;

  useEffect(() => {
    if (!storeId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`store-orders-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            onNewOrderRef.current?.(payload.new as unknown as Order);
          }
          if (payload.eventType === "UPDATE") {
            onOrderUpdateRef.current?.(payload.new as unknown as Order);
          }
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["order-items-batch"] });
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [storeId, queryClient]);

  return { isConnected };
}
