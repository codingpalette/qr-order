"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { CustomerMenuView } from "@/views/customer/CustomerMenuView";
import { AlertCircle } from "lucide-react";

export default function OrderPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const tableNumber = tableParam ? parseInt(tableParam, 10) : NaN;

  if (!tableParam || isNaN(tableNumber)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-2 text-center text-gray-500">
          <AlertCircle className="size-10 text-gray-400" />
          <p className="text-base font-semibold">테이블 정보가 없습니다</p>
          <p className="text-sm">올바른 QR 코드로 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return <CustomerMenuView storeId={storeId} tableNumber={tableNumber} />;
}
