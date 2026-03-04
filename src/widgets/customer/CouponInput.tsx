"use client";

import { useState } from "react";
import { useValidateCoupon } from "@/features/customer-order/api/useValidateCoupon";
import { Loader2, X, TicketIcon } from "lucide-react";

interface CouponInputProps {
  storeId: string;
  orderAmount: number;
  appliedCouponCode: string | null;
  discountAmount: number;
  onApply: (couponId: string, code: string, discountAmount: number) => void;
  onRemove: () => void;
}

export function CouponInput({
  storeId,
  orderAmount,
  appliedCouponCode,
  discountAmount,
  onApply,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const validateCoupon = useValidateCoupon();

  const handleApply = () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    validateCoupon.mutate(
      { code: trimmed, storeId, orderAmount },
      {
        onSuccess: (result) => {
          if (result.valid && result.coupon) {
            onApply(result.coupon.id, trimmed, result.discountAmount);
            setCode("");
          }
        },
      },
    );
  };

  // Applied state
  if (appliedCouponCode) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <TicketIcon className="size-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              쿠폰 적용됨: {appliedCouponCode}
            </p>
            <p className="text-xs text-green-600">
              -{discountAmount.toLocaleString("ko-KR")}원 할인
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="flex size-6 items-center justify-center rounded-full text-green-500 transition-colors active:bg-green-100"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  // Input state
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="쿠폰 코드 입력"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
        />
        <button
          onClick={handleApply}
          disabled={!code.trim() || validateCoupon.isPending}
          className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors active:bg-gray-800 disabled:opacity-40"
        >
          {validateCoupon.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "적용"
          )}
        </button>
      </div>
      {validateCoupon.data && !validateCoupon.data.valid && (
        <p className="text-xs text-red-500">{validateCoupon.data.errorMessage}</p>
      )}
      {validateCoupon.isError && (
        <p className="text-xs text-red-500">쿠폰 확인 중 오류가 발생했습니다.</p>
      )}
    </div>
  );
}
