"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useCallStaff } from "@/features/customer-order/api/useCallStaff";

interface StaffCallButtonProps {
  storeId: string;
  tableNumber: number;
}

export function StaffCallButton({ storeId, tableNumber }: StaffCallButtonProps) {
  const callStaff = useCallStaff();
  const [cooldown, setCooldown] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(false), 30_000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!showFeedback) return;
    const timer = setTimeout(() => setShowFeedback(false), 3_000);
    return () => clearTimeout(timer);
  }, [showFeedback]);

  const handleCall = useCallback(() => {
    if (cooldown || callStaff.isPending) return;
    callStaff.mutate(
      { storeId, tableNumber },
      {
        onSuccess: () => {
          setCooldown(true);
          setShowFeedback(true);
        },
      },
    );
  }, [storeId, tableNumber, cooldown, callStaff]);

  return (
    <>
      <button
        onClick={handleCall}
        disabled={cooldown || callStaff.isPending}
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors",
          cooldown
            ? "bg-gray-100 text-gray-400"
            : "text-gray-600 active:bg-gray-100",
        )}
        title="직원 호출"
      >
        <Bell className="size-5" />
      </button>

      {showFeedback && (
        <div className="fixed inset-x-0 top-0 z-[60] px-4 pt-safe">
          <div className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm text-white shadow-lg">
            <Bell className="size-4 shrink-0" />
            <p>직원을 호출했습니다</p>
          </div>
        </div>
      )}
    </>
  );
}
