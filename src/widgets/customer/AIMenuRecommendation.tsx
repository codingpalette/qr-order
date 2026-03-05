"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Sparkles, Loader2 } from "lucide-react";
import type { DisplayMenuItem } from "@/features/customer-order/model/types";
import type { CartItem } from "@/features/customer-order/model/types";

interface AIMenuRecommendationProps {
  menuItems: DisplayMenuItem[];
  cartItems: CartItem[];
  storeId: string;
  onMenuTap: (item: DisplayMenuItem) => void;
}

interface Recommendation {
  menuId: string;
  reason: string;
}

export function AIMenuRecommendation({
  menuItems,
  cartItems,
  storeId,
  onMenuTap,
}: AIMenuRecommendationProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevCartKey = useRef("");

  const fetchRecommendations = useCallback(async () => {
    if (menuItems.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/menu-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          cartItems: cartItems.map((c) => ({ name: c.name, price: c.price })),
          currentHour: new Date().getHours(),
          menuList: menuItems.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            price: m.price,
            categoryName: m.categoryName,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [menuItems, cartItems, storeId]);

  useEffect(() => {
    const cartKey = cartItems.map((c) => `${c.menuId}:${c.quantity}`).join(",");
    if (cartKey === prevCartKey.current) return;
    prevCartKey.current = cartKey;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchRecommendations, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cartItems, fetchRecommendations]);

  // Initial fetch
  useEffect(() => {
    if (menuItems.length > 0 && recommendations.length === 0 && !isLoading) {
      fetchRecommendations();
    }
  }, [menuItems.length]);

  const recommendedMenus = recommendations
    .map((rec) => {
      const menu = menuItems.find((m) => m.id === rec.menuId);
      return menu ? { ...rec, menu } : null;
    })
    .filter(Boolean) as (Recommendation & { menu: DisplayMenuItem })[];

  if (recommendedMenus.length === 0 && !isLoading) return null;

  return (
    <div className="px-4 pt-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="size-4 text-orange-500" />
        <h3 className="text-sm font-bold text-gray-800">
          {"이런 메뉴는 어때요?"}
        </h3>
        {isLoading && <Loader2 className="size-3 animate-spin text-gray-400" />}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recommendedMenus.map(({ menuId, reason, menu }) => (
          <button
            key={menuId}
            onClick={() => onMenuTap(menu)}
            className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-transform active:scale-[0.97]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {menu.imageUrl ? (
                <Image
                  src={menu.imageUrl}
                  alt={menu.name}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-3xl text-gray-300">
                  🍽
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-sm font-semibold text-gray-900">
                {menu.name}
              </p>
              <p className="text-xs font-bold text-orange-600">
                {menu.price.toLocaleString("ko-KR")}원
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-gray-500">
                {reason}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
