"use client";

import { use } from "react";
import { OrderStatusView } from "@/views/customer/OrderStatusView";

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>;
}) {
  const { storeId, orderId } = use(params);

  return <OrderStatusView storeId={storeId} orderId={orderId} />;
}
