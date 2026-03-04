"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Minus, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { DisplayMenuItem, SelectedOption } from "@/features/customer-order/model/types";
import type { MenuOptionGroup } from "@/entities/menu/model/types";
import { ALLERGEN_LABELS } from "@/shared/lib/allergens";

interface MenuDetailSheetProps {
  item: DisplayMenuItem | null;
  onClose: () => void;
  onAddToCart: (item: DisplayMenuItem, quantity: number, options: SelectedOption[]) => void;
}

export function MenuDetailSheet({
  item,
  onClose,
  onAddToCart,
}: MenuDetailSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Map<string, SelectedOption[]>>(new Map());

  const resetState = useCallback(() => {
    setQuantity(1);
    setSelections(new Map());
  }, []);

  const allSelectedOptions = useMemo(() => {
    return Array.from(selections.values()).flat();
  }, [selections]);

  const optionTotal = useMemo(() => {
    return allSelectedOptions.reduce((s, o) => s + o.priceDelta, 0);
  }, [allSelectedOptions]);

  if (!item) return null;

  const hasOptions = item.optionGroups.length > 0;

  const handleSingleSelect = (group: MenuOptionGroup, optItem: MenuOptionGroup["items"][0]) => {
    setSelections((prev) => {
      const next = new Map(prev);
      next.set(group.id, [
        {
          groupId: group.id,
          groupName: group.name,
          itemId: optItem.id,
          itemName: optItem.name,
          priceDelta: optItem.price_delta,
        },
      ]);
      return next;
    });
  };

  const handleMultiSelect = (group: MenuOptionGroup, optItem: MenuOptionGroup["items"][0]) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(group.id) ?? [];
      const exists = current.find((s) => s.itemId === optItem.id);
      if (exists) {
        const filtered = current.filter((s) => s.itemId !== optItem.id);
        if (filtered.length === 0) {
          next.delete(group.id);
        } else {
          next.set(group.id, filtered);
        }
      } else {
        if (group.max_select > 1 && current.length >= group.max_select) return prev;
        next.set(group.id, [
          ...current,
          {
            groupId: group.id,
            groupName: group.name,
            itemId: optItem.id,
            itemName: optItem.name,
            priceDelta: optItem.price_delta,
          },
        ]);
      }
      return next;
    });
  };

  const requiredGroupsSatisfied = item.optionGroups
    .filter((g) => g.is_required)
    .every((g) => {
      const selected = selections.get(g.id) ?? [];
      return selected.length >= Math.max(g.min_select, 1);
    });

  const totalPrice = (item.price + optionTotal) * quantity;

  const handleAdd = () => {
    onAddToCart(item, quantity, allSelectedOptions);
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { resetState(); onClose(); }} />
      <div className="relative max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white pb-safe">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(85dvh - 140px)" }}>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-6xl text-gray-300">
                🍽
              </div>
            )}
          </div>

          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {item.price.toLocaleString("ko-KR")}원
              </span>
              {item.originalPrice != null && item.originalPrice > item.price && (
                <span className="text-sm text-gray-400 line-through">
                  {item.originalPrice.toLocaleString("ko-KR")}원
                </span>
              )}
            </div>

            {/* Set menu items */}
            {item.menuType === "set" && item.setMenuItems && item.setMenuItems.length > 0 && (
              <div className="mt-3 rounded-lg bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-700 mb-1.5">{"세트 구성"}</p>
                <div className="space-y-1">
                  {item.setMenuItems.map((si, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm text-gray-700">
                      <span>{si.menuName}</span>
                      {si.quantity > 1 && (
                        <span className="text-xs text-gray-500">x{si.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergen info */}
            {item.allergens.length > 0 && (
              <div className="mt-3 flex flex-wrap items-start gap-1.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {item.allergens.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >
                    {ALLERGEN_LABELS[a] ?? a}
                  </span>
                ))}
              </div>
            )}

            {/* Option Groups */}
            {hasOptions && (
              <div className="mt-4 space-y-4">
                {item.optionGroups.map((group) => {
                  const isSingle = group.max_select === 1;
                  const selected = selections.get(group.id) ?? [];

                  return (
                    <div key={group.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">
                          {group.name}
                          {group.is_required && (
                            <span className="ml-1 text-xs font-medium text-red-500">필수</span>
                          )}
                        </h3>
                        {!isSingle && (
                          <span className="text-xs text-gray-400">
                            최대 {group.max_select}개
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {group.items.map((optItem) => {
                          const isSelected = selected.some((s) => s.itemId === optItem.id);
                          return (
                            <button
                              key={optItem.id}
                              onClick={() =>
                                isSingle
                                  ? handleSingleSelect(group, optItem)
                                  : handleMultiSelect(group, optItem)
                              }
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors",
                                isSelected
                                  ? "bg-orange-50 ring-1 ring-orange-300"
                                  : "bg-gray-50 active:bg-gray-100",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex size-5 items-center justify-center rounded-full border-2",
                                    isSelected
                                      ? "border-orange-500 bg-orange-500"
                                      : "border-gray-300",
                                    !isSingle && "rounded",
                                  )}
                                >
                                  {isSelected && (
                                    <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
                                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                                <span className={cn("text-sm", isSelected ? "font-semibold text-gray-900" : "text-gray-700")}>
                                  {optItem.name}
                                </span>
                              </div>
                              {optItem.price_delta !== 0 && (
                                <span className="text-sm text-gray-500">
                                  +{optItem.price_delta.toLocaleString("ko-KR")}원
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-gray-300 transition-colors",
                  quantity <= 1
                    ? "cursor-not-allowed opacity-40"
                    : "active:bg-gray-100",
                )}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-lg font-bold">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-10 items-center justify-center rounded-full border border-gray-300 transition-colors active:bg-gray-100"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => { resetState(); onClose(); }}
              className="flex-1 rounded-xl border border-gray-300 py-3.5 text-base font-bold text-gray-600 transition-colors active:bg-gray-100"
            >
              닫기
            </button>
            <button
              onClick={handleAdd}
              disabled={hasOptions && !requiredGroupsSatisfied}
              className={cn(
                "flex-[2] rounded-xl py-3.5 text-base font-bold text-white transition-colors",
                hasOptions && !requiredGroupsSatisfied
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-orange-500 active:bg-orange-600",
              )}
            >
              {hasOptions && !requiredGroupsSatisfied
                ? "필수 옵션을 선택해주세요"
                : `${totalPrice.toLocaleString("ko-KR")}원 담기`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
