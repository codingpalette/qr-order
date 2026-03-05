"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/entities/order/model/types";

interface KdsOrderCardProps {
  order: Order;
  items: OrderItem[];
  onClick: () => void;
  disabled?: boolean;
  onRevert?: () => void;
}

function useElapsedTime(createdAt: string) {
  const [elapsed, setElapsed] = useState("");
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);
      setMinutes(mins);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return { elapsed, minutes };
}

const nextActionLabel: Partial<Record<OrderStatus, string>> = {
  pending: "조리 시작",
  preparing: "완료 처리",
};

export function KdsOrderCard({ order, items, onClick, disabled, onRevert }: KdsOrderCardProps) {
  const { elapsed, minutes } = useElapsedTime(order.created_at);
  const isCompleted = order.status === "completed";

  const timerColor =
    isCompleted
      ? "text-gray-400"
      : minutes >= 10
        ? "text-red-500"
        : minutes >= 5
          ? "text-yellow-500"
          : "text-green-500";

  const borderColor =
    isCompleted
      ? "border-gray-200"
      : minutes >= 10
        ? "border-red-300"
        : minutes >= 5
          ? "border-yellow-300"
          : "border-gray-200";

  return (
    <div
      role={!isCompleted && !disabled ? "button" : undefined}
      tabIndex={!isCompleted && !disabled ? 0 : undefined}
      onClick={!isCompleted && !disabled ? onClick : undefined}
      onKeyDown={!isCompleted && !disabled ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={cn(
        "w-full rounded-lg border-2 bg-white p-3 text-left transition-shadow",
        !isCompleted && !disabled ? "cursor-pointer hover:shadow-md" : "cursor-default",
        borderColor,
        !isCompleted && minutes >= 10 && "animate-pulse",
      )}
    >
      {/* Header: table number + timer */}
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black text-gray-900">
          T.{order.table_number}
        </span>
        <span className={cn("font-mono text-lg font-bold tabular-nums", timerColor)}>
          {isCompleted
            ? new Date(order.updated_at).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : elapsed}
        </span>
      </div>

      {/* Order items */}
      <div className="mt-2 space-y-0.5">
        {items.map((item) => (
          <div key={item.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate text-gray-700">{item.menu_name}</span>
              <span className="ml-2 shrink-0 font-semibold text-gray-900">
                x{item.quantity}
              </span>
            </div>
            {item.order_item_options && item.order_item_options.length > 0 && (
              <div className="ml-2 space-y-0.5">
                {item.order_item_options.map((opt) => (
                  <p key={opt.id} className="text-xs text-gray-500">
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
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400">{"항목 로딩중..."}</p>
        )}
      </div>

      {/* Memo */}
      {order.memo && (
        <div className="mt-2 flex items-start gap-1 rounded bg-yellow-50 px-2 py-1">
          <span className="shrink-0 text-sm">💬</span>
          <p className="text-xs text-yellow-800">{order.memo}</p>
        </div>
      )}

      {/* Action hint */}
      {!isCompleted && nextActionLabel[order.status] && (
        <div className="mt-2 rounded bg-gray-100 py-1 text-center text-xs font-medium text-gray-500">
          {"탭하여 → "}{nextActionLabel[order.status]}
        </div>
      )}

      {/* Revert button for completed orders */}
      {isCompleted && onRevert && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRevert();
          }}
          className="mt-2 w-full rounded bg-orange-100 py-1.5 text-center text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
        >
          {"↩ 조리중으로 되돌리기"}
        </button>
      )}
    </div>
  );
}
