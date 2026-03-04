"use client";

import { ShoppingCart } from "lucide-react";

interface FloatingCartBarProps {
  itemCount: number;
  totalAmount: number;
  onOpen: () => void;
}

export function FloatingCartBar({
  itemCount,
  totalAmount,
  onOpen,
}: FloatingCartBarProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-6">
      <button
        onClick={onOpen}
        className="flex w-full items-center justify-between rounded-2xl bg-orange-500 px-5 py-3.5 shadow-lg shadow-orange-500/30 transition-colors active:bg-orange-600"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-white" />
          <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-orange-500">
            {itemCount}
          </span>
        </div>
        <span className="text-base font-bold text-white">
          {totalAmount.toLocaleString("ko-KR")}원 · 장바구니 보기
        </span>
      </button>
    </div>
  );
}
