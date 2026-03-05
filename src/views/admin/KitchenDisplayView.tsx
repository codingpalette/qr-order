"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useTodayOrders } from "@/entities/order/api/useOrders";
import { useOrderItemsBatch } from "@/entities/order/api/useOrders";
import { useUpdateOrderStatus } from "@/features/order-management";
import { useOrdersRealtime } from "@/shared/hooks/useOrdersRealtime";
import { useNotificationSound } from "@/shared/hooks/useNotificationSound";
import { useToast, ToastContainer } from "@/shared/ui/toast";
import { KdsHeader } from "@/widgets/admin/kds/KdsHeader";
import { KdsColumn } from "@/widgets/admin/kds/KdsColumn";
import type { Order, OrderStatus } from "@/entities/order/model/types";
import { StaffCallBanner } from "@/widgets/admin/StaffCallBanner";
import { Loader2 } from "lucide-react";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "completed",
};

const MAX_COMPLETED = 10;

export function KitchenDisplayView() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;
  const { data: allOrders = [], isLoading } = useTodayOrders(storeId);
  const updateStatus = useUpdateOrderStatus();
  const { play, enabled, setEnabled } = useNotificationSound();
  const { toast } = useToast();

  const onNewOrder = useCallback(
    (order: Order) => {
      play("newOrder");
      toast({
        type: "order",
        title: "새 주문!",
        description: `테이블 ${order.table_number} - ${order.total_amount.toLocaleString("ko-KR")}원`,
      });
    },
    [play, toast],
  );

  const onOrderUpdate = useCallback(
    () => {
      play("statusChange");
    },
    [play],
  );

  const { isConnected } = useOrdersRealtime({
    storeId,
    onNewOrder,
    onOrderUpdate,
  });

  const pendingOrders = useMemo(
    () => allOrders.filter((o) => o.status === "pending").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [allOrders],
  );
  const preparingOrders = useMemo(
    () => allOrders.filter((o) => o.status === "preparing").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [allOrders],
  );
  const completedOrders = useMemo(
    () =>
      allOrders
        .filter((o) => o.status === "completed")
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, MAX_COMPLETED),
    [allOrders],
  );

  const visibleOrders = useMemo(
    () => [...pendingOrders, ...preparingOrders, ...completedOrders],
    [pendingOrders, preparingOrders, completedOrders],
  );
  const orderIds = useMemo(
    () => visibleOrders.map((o) => o.id),
    [visibleOrders],
  );
  const { data: allItems = [] } = useOrderItemsBatch(orderIds);

  const handleCardClick = useCallback(
    (order: Order) => {
      const next = nextStatus[order.status];
      if (!next) return;
      updateStatus.mutate({ id: order.id, status: next });
    },
    [updateStatus],
  );

  const handleRevert = useCallback(
    (order: Order) => {
      if (!window.confirm(`테이블 ${order.table_number} 주문을 조리중으로 되돌리시겠습니까?`)) return;
      updateStatus.mutate({ id: order.id, status: "preparing" });
    },
    [updateStatus],
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">{"주방 디스플레이 로딩중..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      <ToastContainer />
      <KdsHeader
        isConnected={isConnected}
        soundEnabled={enabled}
        onToggleSound={() => setEnabled(!enabled)}
      />
      <div className="px-4 py-2">
        <StaffCallBanner storeId={storeId} soundEnabled={enabled} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <KdsColumn
          title="대기"
          icon="⏳"
          orders={pendingOrders}
          allItems={allItems}
          color="bg-yellow-100 text-yellow-900"
          onCardClick={handleCardClick}
          isUpdating={updateStatus.isPending}
        />
        <KdsColumn
          title="조리중"
          icon="🔥"
          orders={preparingOrders}
          allItems={allItems}
          color="bg-orange-100 text-orange-900"
          onCardClick={handleCardClick}
          isUpdating={updateStatus.isPending}
        />
        <KdsColumn
          title="완료"
          icon="✅"
          orders={completedOrders}
          allItems={allItems}
          color="bg-green-100 text-green-900"
          onCardClick={handleCardClick}
          onRevert={handleRevert}
          isUpdating={updateStatus.isPending}
        />
      </div>
    </div>
  );
}
