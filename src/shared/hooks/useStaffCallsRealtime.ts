"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { StaffCall } from "@/features/staff-call";

interface UseStaffCallsRealtimeOptions {
  storeId: string | null;
  onNewCall?: (call: StaffCall) => void;
}

export function useStaffCallsRealtime({
  storeId,
  onNewCall,
}: UseStaffCallsRealtimeOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const onNewCallRef = useRef(onNewCall);

  onNewCallRef.current = onNewCall;

  useEffect(() => {
    if (!storeId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`store-staff-calls-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "staff_calls",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          onNewCallRef.current?.(payload.new as unknown as StaffCall);
          queryClient.invalidateQueries({ queryKey: ["staff-calls"] });
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
