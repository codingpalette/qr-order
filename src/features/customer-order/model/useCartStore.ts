"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, SelectedOption } from "./types";

function optionsKey(options: SelectedOption[]): string {
  return options
    .map((o) => o.itemId)
    .sort()
    .join(",");
}

interface CartState {
  storeId: string | null;
  tableNumber: number | null;
  sessionId: string | null;
  items: CartItem[];
  memo: string;
  appliedCouponId: string | null;
  appliedCouponCode: string | null;
  discountAmount: number;
  initCart: (storeId: string, tableNumber: number, sessionId?: string | null) => void;
  addItem: (item: Omit<CartItem, "quantity" | "cartItemId">) => void;
  addItemSimple: (item: Omit<CartItem, "quantity" | "cartItemId" | "selectedOptions">) => void;
  incrementItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setMemo: (memo: string) => void;
  applyCoupon: (couponId: string, code: string, discountAmount: number) => void;
  removeCoupon: () => void;
  totalAmount: () => number;
  finalAmount: () => number;
  totalItemCount: () => number;
  getItemQuantity: (menuId: string) => number;
  getCartItemsForMenu: (menuId: string) => CartItem[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      tableNumber: null,
      sessionId: null,
      items: [],
      memo: "",
      appliedCouponId: null,
      appliedCouponCode: null,
      discountAmount: 0,

      initCart: (storeId: string, tableNumber: number, sessionId?: string | null) => {
        const state = get();
        const newSessionId = sessionId ?? null;
        if (state.storeId !== storeId || state.tableNumber !== tableNumber || state.sessionId !== newSessionId) {
          set({ storeId, tableNumber, sessionId: newSessionId, items: [], memo: "", appliedCouponId: null, appliedCouponCode: null, discountAmount: 0 });
        }
      },

      addItem: (item) => {
        const { items } = get();
        // Find existing item with same menuId AND same options
        const existing = items.find(
          (i) =>
            i.menuId === item.menuId &&
            optionsKey(i.selectedOptions) === optionsKey(item.selectedOptions),
        );
        if (existing) {
          set({
            items: items.map((i) =>
              i.cartItemId === existing.cartItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i,
            ),
          });
        } else {
          set({
            items: [
              ...items,
              { ...item, cartItemId: crypto.randomUUID(), quantity: 1 },
            ],
          });
        }
      },

      addItemSimple: (item) => {
        get().addItem({ ...item, selectedOptions: [] });
      },

      incrementItem: (cartItemId) => {
        set({
          items: get().items.map((i) =>
            i.cartItemId === cartItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        });
      },

      decrementItem: (cartItemId) => {
        const items = get().items;
        const item = items.find((i) => i.cartItemId === cartItemId);
        if (!item) return;
        if (item.quantity <= 1) {
          set({ items: items.filter((i) => i.cartItemId !== cartItemId) });
        } else {
          set({
            items: items.map((i) =>
              i.cartItemId === cartItemId
                ? { ...i, quantity: i.quantity - 1 }
                : i,
            ),
          });
        }
      },

      removeItem: (cartItemId) => {
        set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) });
      },

      clearCart: () => {
        set({ items: [], memo: "", appliedCouponId: null, appliedCouponCode: null, discountAmount: 0 });
      },

      setMemo: (memo: string) => {
        set({ memo });
      },

      applyCoupon: (couponId: string, code: string, discountAmount: number) => {
        set({ appliedCouponId: couponId, appliedCouponCode: code, discountAmount });
      },

      removeCoupon: () => {
        set({ appliedCouponId: null, appliedCouponCode: null, discountAmount: 0 });
      },

      totalAmount: () => {
        return get().items.reduce((sum, i) => {
          const optionTotal = i.selectedOptions.reduce(
            (s, o) => s + o.priceDelta,
            0,
          );
          return sum + (i.price + optionTotal) * i.quantity;
        }, 0);
      },

      finalAmount: () => {
        const state = get();
        return Math.max(0, state.totalAmount() - state.discountAmount);
      },

      totalItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getItemQuantity: (menuId) => {
        return get()
          .items.filter((i) => i.menuId === menuId)
          .reduce((sum, i) => sum + i.quantity, 0);
      },

      getCartItemsForMenu: (menuId) => {
        return get().items.filter((i) => i.menuId === menuId);
      },
    }),
    {
      name: "qr-order-cart",
    },
  ),
);
