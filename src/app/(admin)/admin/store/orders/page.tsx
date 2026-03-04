"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useOrders, useOrderItems } from "@/entities/order/api/useOrders";
import { DateRangePicker } from "@/widgets/admin/analytics/DateRangePicker";
import { type DateRange, getPresetDateRange } from "@/shared/lib/date-utils";
import { useUpdateOrderStatus, useCancelOrder } from "@/features/order-management";
import { useResetTableByNumber } from "@/features/table-management";
import { useOrdersRealtime } from "@/shared/hooks/useOrdersRealtime";
import { useNotificationSound } from "@/shared/hooks/useNotificationSound";
import { useToast, ToastContainer } from "@/shared/ui/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from "@/shared/ui";
import { StaffCallBanner } from "@/widgets/admin/StaffCallBanner";
import {
  ClipboardListIcon,
  ChefHatIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  RotateCcwIcon,
  Volume2Icon,
  VolumeOffIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Order, OrderStatus } from "@/entities/order/model/types";

const statusLabels: Record<OrderStatus, string> = {
  pending: "대기",
  confirmed: "확인",
  preparing: "조리중",
  completed: "완료",
  cancelled: "취소",
};

const statusVariants: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  confirmed: "secondary",
  preparing: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "completed",
};

const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
  pending: "조리 시작",
  preparing: "완료 처리",
};

export default function StoreOrdersPage() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange("today"));
  const { data: allOrders = [] } = useOrders(storeId, null, dateRange);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const resetTable = useResetTableByNumber();
  const { play, enabled: soundEnabled, setEnabled: setSoundEnabled } = useNotificationSound();
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

  const { isConnected } = useOrdersRealtime({
    storeId,
    onNewOrder,
  });

  const [activeTab, setActiveTab] = useState("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [resetTarget, setResetTarget] = useState<number | null>(null);

  const { data: orderItems = [] } = useOrderItems(detailOrder?.id ?? null);

  const filteredOrders =
    activeTab === "all"
      ? allOrders
      : allOrders.filter((o) => o.status === activeTab);

  const statusCounts = {
    all: allOrders.length,
    pending: allOrders.filter((o) => o.status === "pending").length,
    preparing: allOrders.filter((o) => o.status === "preparing").length,
    completed: allOrders.filter((o) => o.status === "completed").length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
  };

  const handleNextStatus = (order: Order) => {
    const next = nextStatus[order.status as OrderStatus];
    if (!next) return;
    updateStatus.mutate({ id: order.id, status: next });
  };

  const openCancelDialog = (order: Order) => {
    setCancelTarget(order);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleResetTable = () => {
    if (!storeId || resetTarget === null) return;
    resetTable.mutate(
      { storeId, tableNumber: resetTarget },
      { onSuccess: () => setResetTarget(null) },
    );
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelOrder.mutate(
      { id: cancelTarget.id, reason: cancelReason.trim() || undefined },
      { onSuccess: () => setCancelDialogOpen(false) },
    );
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"주문 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"실시간 주문을 관리합니다."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1">
            <div
              className={cn(
                "size-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-400",
              )}
            />
            <span className="text-muted-foreground text-xs">
              {isConnected ? "실시간" : "연결 끊김"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2Icon className="size-4" />
            ) : (
              <VolumeOffIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <StaffCallBanner storeId={storeId} soundEnabled={soundEnabled} />

      <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {"전체"} ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {"대기"} ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            {"조리중"} ({statusCounts.preparing})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {"완료"} ({statusCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            {"취소"} ({statusCounts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <ClipboardListIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"주문이 없습니다"}</h3>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => {
                const status = order.status as OrderStatus;
                return (
                  <Card key={order.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-1">
                        <CardTitle className="text-base">
                          {"테이블 "}
                          {order.table_number}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setResetTarget(order.table_number)}
                          title="테이블 초기화"
                        >
                          <RotateCcwIcon className="size-3.5" />
                        </Button>
                      </div>
                      <Badge variant={statusVariants[status]}>
                        {statusLabels[status]}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-lg font-bold">
                          {order.total_amount.toLocaleString("ko-KR")}{"원"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(order.created_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {order.cancel_reason && (
                        <p className="text-xs text-destructive">
                          {"취소 사유: "}{order.cancel_reason}
                        </p>
                      )}
                      <div className="flex items-center gap-1 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="gap-1"
                          onClick={() => setDetailOrder(order)}
                        >
                          <EyeIcon className="size-3" />
                          {"상세"}
                        </Button>
                        {nextStatus[status] && (
                          <Button
                            size="xs"
                            className="gap-1"
                            onClick={() => handleNextStatus(order)}
                            disabled={updateStatus.isPending}
                          >
                            {status === "pending" ? (
                              <ChefHatIcon className="size-3" />
                            ) : (
                              <CheckCircleIcon className="size-3" />
                            )}
                            {nextStatusLabel[status]}
                          </Button>
                        )}
                        {(status === "pending" || status === "preparing") && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="gap-1 text-destructive"
                            onClick={() => openCancelDialog(order)}
                          >
                            <XCircleIcon className="size-3" />
                            {"취소"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {"주문 상세 - 테이블 "}
              {detailOrder?.table_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariants[(detailOrder?.status ?? "pending") as OrderStatus]}>
                {statusLabels[(detailOrder?.status ?? "pending") as OrderStatus]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {detailOrder && new Date(detailOrder.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="space-y-2">
              {orderItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">{"주문 항목을 불러오는 중..."}</p>
              ) : (
                orderItems.map((item) => (
                  <div key={item.id} className="py-2 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.menu_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.unit_price.toLocaleString("ko-KR")}{"원 x "}{item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {item.total_price.toLocaleString("ko-KR")}{"원"}
                      </p>
                    </div>
                    {item.order_item_options && item.order_item_options.length > 0 && (
                      <div className="mt-1 ml-3 space-y-0.5">
                        {item.order_item_options.map((opt) => (
                          <p key={opt.id} className="text-xs text-muted-foreground">
                            {"└ "}{opt.option_item_name}
                            {opt.price_delta !== 0 && (
                              <span className="ml-1">
                                ({opt.price_delta > 0 ? "+" : ""}{opt.price_delta.toLocaleString("ko-KR")}{"원"})
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {detailOrder?.memo && (
              <div className="flex items-start gap-2 rounded bg-yellow-50 px-3 py-2">
                <span className="shrink-0 text-sm">💬</span>
                <p className="text-sm text-yellow-800">{detailOrder.memo}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="font-medium">{"합계"}</p>
              <p className="text-lg font-bold">
                {detailOrder?.total_amount.toLocaleString("ko-KR")}{"원"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOrder(null)}>
              {"닫기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Table Dialog */}
      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"테이블 초기화"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              {"테이블 "}
              {resetTarget}
              {"번을 초기화하시겠습니까? 현재 세션이 종료되고 새로운 세션이 시작됩니다."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              {"돌아가기"}
            </Button>
            <Button
              onClick={handleResetTable}
              disabled={resetTable.isPending}
            >
              {resetTable.isPending ? "처리중..." : "초기화"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"주문 취소"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              {"테이블 "}
              {cancelTarget?.table_number}
              {" 주문을 취소하시겠습니까?"}
            </p>
            <div className="space-y-2">
              <Label>{"취소 사유 (선택)"}</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {"돌아가기"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? "처리중..." : "주문 취소"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
