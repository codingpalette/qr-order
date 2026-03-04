"use client";

import { Store as StoreIcon, ClipboardList } from "lucide-react";
import { StaffCallButton } from "./StaffCallButton";

interface CustomerMenuHeaderProps {
  storeName: string;
  tableNumber: number;
  storeId: string;
  onOpenHistory: () => void;
}

export function CustomerMenuHeader({
  storeName,
  tableNumber,
  storeId,
  onOpenHistory,
}: CustomerMenuHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-orange-100">
          <StoreIcon className="size-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">{storeName}</h1>
          <p className="text-sm text-gray-500">테이블 {tableNumber}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenHistory}
            className="flex size-9 items-center justify-center rounded-full text-gray-600 transition-colors active:bg-gray-100"
            title="주문 내역"
          >
            <ClipboardList className="size-5" />
          </button>
          <StaffCallButton storeId={storeId} tableNumber={tableNumber} />
        </div>
      </div>
    </header>
  );
}
