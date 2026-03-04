"use client";

import { X, AlertTriangle, Loader2, Clock } from "lucide-react";
import type { CartItem } from "@/features/customer-order/model/types";
import { CouponInput } from "./CouponInput";

interface OrderConfirmSheetProps {
  isOpen: boolean;
  items: CartItem[];
  totalAmount: number;
  tableNumber: number;
  isSubmitting: boolean;
  memo: string;
  onMemoChange: (memo: string) => void;
  avgPrepMinutes?: number;
  storeId: string;
  appliedCouponCode: string | null;
  discountAmount: number;
  onCouponApply: (couponId: string, code: string, discountAmount: number) => void;
  onCouponRemove: () => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrderConfirmSheet({
  isOpen,
  items,
  totalAmount,
  tableNumber,
  isSubmitting,
  memo,
  onMemoChange,
  avgPrepMinutes,
  storeId,
  appliedCouponCode,
  discountAmount,
  onCouponApply,
  onCouponRemove,
  onClose,
  onConfirm,
}: OrderConfirmSheetProps) {
  if (!isOpen) return null;

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white pb-safe">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">주문 확인</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors active:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(85dvh - 160px)" }}>
          <div className="px-4 py-3">
            {/* Estimated prep time */}
            {avgPrepMinutes != null && avgPrepMinutes > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <Clock className="size-4 shrink-0 text-blue-500" />
                <p className="text-xs text-blue-700">
                  예상 조리시간 약 {avgPrepMinutes}분
                </p>
              </div>
            )}

            <div className="mb-3 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
              <AlertTriangle className="size-4 shrink-0 text-orange-500" />
              <p className="text-xs text-orange-700">
                테이블 {tableNumber}번으로 주문이 전송됩니다. 주문 내역을 확인해주세요.
              </p>
            </div>

            <div className="max-h-[30dvh] overflow-y-auto">
              {items.map((item) => {
                const optionTotal = item.selectedOptions.reduce(
                  (s, o) => s + o.priceDelta,
                  0,
                );
                const unitPrice = item.price + optionTotal;

                return (
                  <div
                    key={item.cartItemId}
                    className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-900">{item.name}</p>
                      {item.selectedOptions.length > 0 && (
                        <p className="truncate text-xs text-gray-400">
                          {item.selectedOptions.map((o) => {
                            const delta = o.priceDelta > 0 ? ` (+${o.priceDelta.toLocaleString("ko-KR")}원)` : "";
                            return `${o.itemName}${delta}`;
                          }).join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {unitPrice.toLocaleString("ko-KR")}원 × {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-gray-900">
                      {(unitPrice * item.quantity).toLocaleString("ko-KR")}원
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Coupon */}
            <div className="mt-3">
              <CouponInput
                storeId={storeId}
                orderAmount={totalAmount}
                appliedCouponCode={appliedCouponCode}
                discountAmount={discountAmount}
                onApply={onCouponApply}
                onRemove={onCouponRemove}
              />
            </div>

            {/* Memo */}
            <div className="mt-3">
              <textarea
                value={memo}
                onChange={(e) => onMemoChange(e.target.value)}
                placeholder="요청사항을 입력해주세요 (예: 얼음 빼주세요)"
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                rows={2}
                maxLength={200}
              />
            </div>

            {/* Order summary */}
            <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  주문 금액 ({items.reduce((s, i) => s + i.quantity, 0)}개)
                </span>
                <span className="text-sm text-gray-900">
                  {totalAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">쿠폰 할인</span>
                  <span className="text-sm font-medium text-green-600">
                    -{discountAmount.toLocaleString("ko-KR")}원
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-1.5">
                <span className="text-base font-bold text-gray-900">최종 결제 금액</span>
                <span className="text-xl font-bold text-orange-500">
                  {finalAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-base font-bold text-white transition-colors active:bg-orange-600 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                주문 전송 중...
              </>
            ) : (
              `${finalAmount.toLocaleString("ko-KR")}원 주문 확정`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
