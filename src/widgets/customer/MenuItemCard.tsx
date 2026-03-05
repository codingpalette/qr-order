"use client";

import Image from "next/image";
import { Minus, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { DisplayMenuItem } from "@/features/customer-order/model/types";

interface MenuItemCardProps {
  item: DisplayMenuItem;
  quantity: number;
  onTap: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function MenuItemCard({
  item,
  quantity,
  onTap,
  onIncrement,
  onDecrement,
}: MenuItemCardProps) {
  const hasOptions = item.optionGroups.length > 0;

  return (
    <div
      className={cn(
        "flex w-full gap-3 rounded-xl bg-white p-3 transition-colors",
        item.isSoldOut && "opacity-60",
      )}
    >
      <div
        onClick={item.isSoldOut ? undefined : onTap}
        className="relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-gray-100"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className={cn("object-cover", item.isSoldOut && "grayscale")}
            sizes="80px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl text-gray-300">
            🍽
          </div>
        )}
        {item.isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              품절
            </span>
          </div>
        )}
      </div>
      <div
        onClick={item.isSoldOut ? undefined : onTap}
        className="flex min-w-0 flex-1 cursor-pointer flex-col justify-center"
      >
        <div className="flex items-center gap-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {item.name}
          </h3>
          {item.menuType === "set" && (
            <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
              세트
            </span>
          )}
          {item.allergens.length > 0 && (
            <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
            {item.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-sm font-bold text-gray-900">
            {item.price.toLocaleString("ko-KR")}원
          </span>
          {item.originalPrice != null && item.originalPrice > item.price && (
            <span className="text-xs text-gray-400 line-through">
              {item.originalPrice.toLocaleString("ko-KR")}원
            </span>
          )}
        </div>
      </div>

      {/* Inline quantity controls */}
      {!item.isSoldOut && (
        <div className="flex shrink-0 flex-col items-center justify-center">
          {quantity > 0 && !hasOptions ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement();
                }}
                className="flex size-7 items-center justify-center rounded-full border border-gray-300 transition-colors active:bg-gray-100"
              >
                <Minus className="size-3" />
              </button>
              <span
                key={quantity}
                className="w-5 animate-pop text-center text-sm font-bold text-orange-500"
              >
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement();
                }}
                className="flex size-7 items-center justify-center rounded-full bg-orange-500 text-white transition-colors active:bg-orange-600"
              >
                <Plus className="size-3" />
              </button>
            </div>
          ) : hasOptions && quantity > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTap();
              }}
              className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition-colors active:bg-orange-600"
            >
              <span>{quantity}</span>
              <Plus className="size-3" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                hasOptions ? onTap() : onIncrement();
              }}
              className="flex size-8 items-center justify-center rounded-full border border-orange-300 text-orange-500 transition-all active:scale-110 active:bg-orange-50"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
