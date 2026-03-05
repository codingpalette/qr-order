"use client";

import { cn } from "@/shared/lib/utils";
import { KdsOrderCard } from "./KdsOrderCard";
import type { Order, OrderItem } from "@/entities/order/model/types";

interface KdsColumnProps {
  title: string;
  icon: string;
  orders: Order[];
  allItems: OrderItem[];
  color: string;
  onCardClick: (order: Order) => void;
  onRevert?: (order: Order) => void;
  isUpdating?: boolean;
}

export function KdsColumn({
  title,
  icon,
  orders,
  allItems,
  color,
  onCardClick,
  onRevert,
  isUpdating,
}: KdsColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Column header */}
      <div className={cn("flex items-center gap-2 border-b px-3 py-2.5", color)}>
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
        <span className="ml-auto inline-flex size-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold">
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-2">
        {orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-400">{"주문 없음"}</p>
          </div>
        ) : (
          orders.map((order) => (
            <KdsOrderCard
              key={order.id}
              order={order}
              items={allItems.filter((i) => i.order_id === order.id)}
              onClick={() => onCardClick(order)}
              disabled={isUpdating}
              onRevert={onRevert ? () => onRevert(order) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
