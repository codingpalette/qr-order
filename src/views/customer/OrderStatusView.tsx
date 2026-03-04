"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import { useOrderItems } from "@/entities/order/api/useOrders";
import type { Order, OrderStatus } from "@/entities/order/model/types";
import type { Store } from "@/entities/store/model/types";
import {
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChefHat,
  CircleCheck,
  XCircle,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

interface OrderStatusViewProps {
  storeId: string;
  orderId: string;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: typeof Clock; color: string; bgColor: string }
> = {
  pending: {
    label: "주문 접수 대기",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  confirmed: {
    label: "주문 접수 완료",
    icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  preparing: {
    label: "조리 중",
    icon: ChefHat,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  completed: {
    label: "조리 완료",
    icon: CircleCheck,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  cancelled: {
    label: "주문 취소",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "completed",
];

export function OrderStatusView({ storeId, orderId }: OrderStatusViewProps) {
  const queryClient = useQueryClient();

  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery<Order | null>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as unknown as Order;
    },
  });

  const { data: store } = useQuery<Store | null>({
    queryKey: ["store", storeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();
      if (error) throw error;
      return data as unknown as Store;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Realtime subscription for order status changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  const { data: orderItems, isLoading: itemsLoading } =
    useOrderItems(orderId);

  if (orderLoading || itemsLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-2 text-center text-gray-500">
          <AlertCircle className="size-10 text-gray-400" />
          <p className="text-base font-semibold">주문을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[order.status];
  const StatusIcon = config.icon;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isWaiting = ["pending", "confirmed", "preparing"].includes(order.status);

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Status Header */}
      <div className={cn("px-4 pb-6 pt-safe", config.bgColor)}>
        <div className="pt-8 text-center">
          <div
            className={cn(
              "mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white",
              config.color,
            )}
          >
            <StatusIcon className="size-8" />
          </div>
          <h1 className={cn("text-xl font-bold", config.color)}>
            {config.label}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            테이블 {order.table_number}번
          </p>
          {isWaiting && store?.avg_prep_minutes != null && store.avg_prep_minutes > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1">
              <Clock className="size-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">
                예상 대기시간 약 {store.avg_prep_minutes}분
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      {!isCancelled && (
        <div className="bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const stepConfig = STATUS_CONFIG[step];
              const isActive = index <= currentStepIndex;
              const isLast = index === STATUS_STEPS.length - 1;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-400",
                      )}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-[10px]",
                        isActive
                          ? "font-semibold text-gray-900"
                          : "text-gray-400",
                      )}
                    >
                      {stepConfig.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 flex-1",
                        index < currentStepIndex
                          ? "bg-orange-500"
                          : "bg-gray-200",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled reason */}
      {isCancelled && order.cancel_reason && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            <span className="font-semibold">취소 사유:</span>{" "}
            {order.cancel_reason}
          </p>
        </div>
      )}

      {/* Order Items */}
      <div className="mt-4 bg-white px-4 py-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">주문 내역</h2>
        <div className="space-y-2.5">
          {orderItems?.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900">
                  {item.menu_name}
                </p>
                <p className="text-xs text-gray-500">
                  {item.unit_price.toLocaleString("ko-KR")}원 × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                {item.total_price.toLocaleString("ko-KR")}원
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-bold text-gray-900">합계</span>
          <span className="text-base font-bold text-orange-500">
            {order.total_amount.toLocaleString("ko-KR")}원
          </span>
        </div>
      </div>

      {/* Order Info */}
      <div className="mt-4 bg-white px-4 py-4">
        <h2 className="mb-2 text-sm font-bold text-gray-900">주문 정보</h2>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>주문번호</span>
            <span className="font-mono text-xs text-gray-400">
              {order.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>주문시간</span>
            <span>
              {new Date(order.created_at).toLocaleString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {order.memo && (
            <div className="flex justify-between">
              <span>요청사항</span>
              <span className="max-w-[60%] text-right text-gray-500">
                {order.memo}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Back to menu */}
      <div className="px-4 py-6">
        <Link
          href={`/order/${storeId}?table=${order.table_number}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white py-3.5 text-base font-bold text-orange-500 transition-colors active:bg-orange-50"
        >
          <UtensilsCrossed className="size-5" />
          추가 주문하기
        </Link>
      </div>
    </div>
  );
}
