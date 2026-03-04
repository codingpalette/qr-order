"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useComposedMenuList } from "@/features/customer-order/api/useComposedMenuList";
import { useCartStore } from "@/features/customer-order/model/useCartStore";
import { useCreateOrder } from "@/features/customer-order/api/useCreateOrder";
import { useTableOrders } from "@/features/customer-order/api/useTableOrders";
import { useTableSession } from "@/features/customer-order/api/useTableSession";
import { createClient } from "@/shared/api/supabase/client";
import type { DisplayMenuItem, SelectedOption } from "@/features/customer-order/model/types";
import type { Order } from "@/entities/order/model/types";
import {
  CustomerMenuHeader,
  CategoryFilterBar,
  MenuItemCard,
  MenuDetailSheet,
  FloatingCartBar,
  CartSheet,
  OrderConfirmSheet,
  OrderHistorySheet,
  MenuSearchBar,
  EventBannerCarousel,
} from "@/widgets/customer";
import { Loader2, AlertCircle, ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CustomerMenuViewProps {
  storeId: string;
  tableNumber: number;
}

export function CustomerMenuView({
  storeId,
  tableNumber,
}: CustomerMenuViewProps) {
  const router = useRouter();
  const { menuItems, categoryList, store, isLoading } =
    useComposedMenuList(storeId);
  const cart = useCartStore();
  const createOrder = useCreateOrder();
  const { data: sessionId } = useTableSession(storeId, tableNumber);
  const { data: tableOrders, isLoading: historyLoading } = useTableOrders(
    storeId,
    tableNumber,
    sessionId,
  );

  const { data: activeOrders } = useQuery<Order[]>({
    queryKey: ["active-orders", storeId, tableNumber, sessionId],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .eq("table_number", tableNumber)
        .in("status", ["pending", "confirmed", "preparing"]);

      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
    staleTime: 10 * 1000,
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<DisplayMenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    cart.initCart(storeId, tableNumber, sessionId ?? null);
  }, [storeId, tableNumber, sessionId]);

  // Filter menus: search + category
  const filteredMenus = menuItems.filter((m) => {
    const matchesCategory = selectedCategory
      ? m.categoryId === selectedCategory
      : true;
    const matchesSearch = searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = useCallback(
    (item: DisplayMenuItem, quantity: number, options: SelectedOption[] = []) => {
      for (let i = 0; i < quantity; i++) {
        cart.addItem({
          menuId: item.id,
          menuType: item.menuType,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          selectedOptions: options,
        });
      }
    },
    [cart],
  );

  const handleSimpleAdd = useCallback(
    (item: DisplayMenuItem) => {
      cart.addItemSimple({
        menuId: item.id,
        menuType: item.menuType,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      });
    },
    [cart],
  );

  const handleConfirmOrder = useCallback(async () => {
    if (cart.items.length === 0) return;

    try {
      const order = await createOrder.mutateAsync({
        storeId,
        tableNumber,
        items: cart.items,
        totalAmount: cart.totalAmount(),
        memo: cart.memo || undefined,
        sessionId: sessionId ?? undefined,
        couponId: cart.appliedCouponId ?? undefined,
        discountAmount: cart.discountAmount > 0 ? cart.discountAmount : undefined,
      });
      cart.clearCart();
      setIsConfirmOpen(false);
      setIsCartOpen(false);
      router.push(`/order/${storeId}/status/${order.id}`);
    } catch {
      // Error is accessible via createOrder.error
    }
  }, [cart, storeId, tableNumber, createOrder, router]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Find the first cart item for a menu to use for decrement
  const getFirstCartItemId = (menuId: string): string | undefined => {
    return cart.items.find((i) => i.menuId === menuId)?.cartItemId;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">메뉴를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-2 text-center text-gray-500">
          <AlertCircle className="size-10 text-gray-400" />
          <p className="text-base font-semibold">매장을 찾을 수 없습니다</p>
          <p className="text-sm">올바른 QR 코드로 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  if (!store.is_active) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-2 text-center text-gray-500">
          <AlertCircle className="size-10 text-gray-400" />
          <p className="text-base font-semibold">현재 운영 중이 아닙니다</p>
          <p className="text-sm">매장 운영시간을 확인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      <CustomerMenuHeader
        storeName={store.name}
        tableNumber={tableNumber}
        storeId={storeId}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <EventBannerCarousel storeId={storeId} />

      {activeOrders && activeOrders.length > 0 && (
        <Link
          href={`/order/${storeId}/status/${activeOrders[0].id}`}
          className="mx-4 mt-3 flex items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 transition-colors active:bg-orange-100"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-orange-100">
            <ChefHat className="size-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              진행 중인 주문이 있어요
            </p>
            <p className="text-xs text-orange-600">
              탭하여 주문 현황 보기
            </p>
          </div>
          <span className="text-orange-400">&rarr;</span>
        </Link>
      )}

      <MenuSearchBar onSearch={handleSearch} />

      <CategoryFilterBar
        categories={categoryList}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="space-y-2 px-4 py-3">
        {filteredMenus.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {searchQuery ? "검색 결과가 없습니다" : "등록된 메뉴가 없습니다"}
          </div>
        ) : (
          filteredMenus.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              quantity={cart.getItemQuantity(item.id)}
              onTap={() => setDetailItem(item)}
              onIncrement={() => {
                if (item.optionGroups.length > 0) {
                  setDetailItem(item);
                } else {
                  handleSimpleAdd(item);
                }
              }}
              onDecrement={() => {
                const cid = getFirstCartItemId(item.id);
                if (cid) cart.decrementItem(cid);
              }}
            />
          ))
        )}
      </div>

      <FloatingCartBar
        itemCount={cart.totalItemCount()}
        totalAmount={cart.totalAmount()}
        onOpen={() => setIsCartOpen(true)}
      />

      <MenuDetailSheet
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAddToCart={handleAddToCart}
      />

      <CartSheet
        isOpen={isCartOpen}
        items={cart.items}
        totalAmount={cart.totalAmount()}
        onClose={() => setIsCartOpen(false)}
        onIncrement={cart.incrementItem}
        onDecrement={cart.decrementItem}
        onRemove={cart.removeItem}
        onOrder={() => {
          setIsCartOpen(false);
          setIsConfirmOpen(true);
        }}
      />

      <OrderConfirmSheet
        isOpen={isConfirmOpen}
        items={cart.items}
        totalAmount={cart.totalAmount()}
        tableNumber={tableNumber}
        isSubmitting={createOrder.isPending}
        memo={cart.memo}
        onMemoChange={cart.setMemo}
        avgPrepMinutes={store.avg_prep_minutes}
        storeId={storeId}
        appliedCouponCode={cart.appliedCouponCode}
        discountAmount={cart.discountAmount}
        onCouponApply={cart.applyCoupon}
        onCouponRemove={cart.removeCoupon}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmOrder}
      />

      <OrderHistorySheet
        isOpen={isHistoryOpen}
        orders={tableOrders ?? []}
        storeId={storeId}
        isLoading={historyLoading}
        onClose={() => setIsHistoryOpen(false)}
      />

      {createOrder.isError && (
        <div className="fixed inset-x-0 top-0 z-[60] px-4 pt-safe">
          <div className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm text-white shadow-lg">
            <AlertCircle className="size-4 shrink-0" />
            <p>주문에 실패했습니다. 다시 시도해주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
