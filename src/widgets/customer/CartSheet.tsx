"use client";

import { Minus, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/features/customer-order/model/types";

interface CartSheetProps {
  isOpen: boolean;
  items: CartItem[];
  totalAmount: number;
  onClose: () => void;
  onIncrement: (cartItemId: string) => void;
  onDecrement: (cartItemId: string) => void;
  onRemove: (cartItemId: string) => void;
  onOrder: () => void;
}

export function CartSheet({
  isOpen,
  items,
  totalAmount,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onOrder,
}: CartSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[80dvh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white pb-safe">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">장바구니</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors active:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShoppingCartEmpty className="mb-2 size-12" />
            <p className="text-sm">장바구니가 비어있습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-4 py-2" style={{ maxHeight: "calc(80dvh - 160px)" }}>
              {items.map((item) => {
                const optionTotal = item.selectedOptions.reduce(
                  (s, o) => s + o.priceDelta,
                  0,
                );
                const itemTotal = (item.price + optionTotal) * item.quantity;

                return (
                  <div
                    key={item.cartItemId}
                    className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.name}
                      </p>
                      {item.selectedOptions.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {item.selectedOptions.map((o) => o.itemName).join(" / ")}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm font-bold text-gray-700">
                        {itemTotal.toLocaleString("ko-KR")}원
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDecrement(item.cartItemId)}
                        className="flex size-7 items-center justify-center rounded-full border border-gray-300 transition-colors active:bg-gray-100"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onIncrement(item.cartItemId)}
                        className="flex size-7 items-center justify-center rounded-full border border-gray-300 transition-colors active:bg-gray-100"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        onClick={() => onRemove(item.cartItemId)}
                        className="ml-1 flex size-7 items-center justify-center rounded-full text-gray-400 transition-colors active:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">총 주문금액</span>
                <span className="text-lg font-bold text-gray-900">
                  {totalAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
              <button
                onClick={onOrder}
                className="w-full rounded-xl bg-orange-500 py-3.5 text-base font-bold text-white transition-colors active:bg-orange-600"
              >
                주문하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ShoppingCartEmpty({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}
