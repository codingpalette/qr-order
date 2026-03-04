"use client";

import { X, ChefHat, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TableOrderWithItems } from "@/features/customer-order/api/useTableOrders";
import type { OrderStatus } from "@/entities/order/model/types";
import Link from "next/link";

interface OrderHistorySheetProps {
  isOpen: boolean;
  orders: TableOrderWithItems[];
  storeId: string;
  isLoading: boolean;
  onClose: () => void;
}

const STATUS_BADGE: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "대기", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "접수", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "조리중", color: "bg-orange-100 text-orange-700" },
  completed: { label: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700" },
};

const STATUS_ICON: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export function OrderHistorySheet({
  isOpen,
  orders,
  storeId,
  isLoading,
  onClose,
}: OrderHistorySheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[80dvh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white pb-safe">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">주문 내역</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors active:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          className="overflow-y-auto px-4 py-2"
          style={{ maxHeight: "calc(80dvh - 60px)" }}
        >
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">
              불러오는 중...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              오늘 주문 내역이 없습니다
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {orders.map((order) => {
                const badge = STATUS_BADGE[order.status];
                const Icon = STATUS_ICON[order.status];
                const isActive = ["pending", "confirmed", "preparing"].includes(
                  order.status,
                );

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gray-100 bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-gray-400" />
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            badge.color,
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.menu_name} × {item.quantity}
                          </span>
                          <span className="text-gray-500">
                            {item.total_price.toLocaleString("ko-KR")}원
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
                      <span className="text-sm font-bold text-gray-900">
                        {order.total_amount.toLocaleString("ko-KR")}원
                      </span>
                      {isActive && (
                        <Link
                          href={`/order/${storeId}/status/${order.id}`}
                          className="text-xs font-medium text-orange-500 active:text-orange-600"
                          onClick={onClose}
                        >
                          주문 현황 보기 &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
