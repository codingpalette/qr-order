"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useStores } from "@/entities/store/api/useStores";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import {
  useFranchiseAnalyticsOrders,
  useAnalyticsOrderItems,
} from "@/entities/order/api/useAnalyticsOrders";
import {
  aggregateSalesByPeriod,
  aggregateByStore,
} from "@/entities/order/lib/aggregations";
import {
  DateRangePicker,
  PeriodTabs,
  SalesChart,
  StoreComparisonChart,
} from "@/widgets/admin/analytics";
import {
  exportSalesReport,
  exportStoreComparison,
} from "@/features/analytics-export/lib/csv-export";
import { type DateRange, getDefaultDateRange } from "@/shared/lib/date-utils";
import type { AnalyticsPeriod } from "@/entities/order/model/types";
import {
  ShoppingCartIcon,
  StoreIcon,
  ReceiptIcon,
  DownloadIcon,
} from "lucide-react";

function WonIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M4 4l2.5 16h1L10 8l2 12h1L15.5 8l2 12h1L21 4" />
      <path d="M3 10h18" />
      <path d="M3 14h18" />
    </svg>
  );
}

export function BrandAnalyticsView() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");

  const { data: stores = [] } = useStores(franchiseId);
  const storeIds = useMemo(() => stores.map((s) => s.id), [stores]);
  const storeMap = useMemo(
    () => new Map(stores.map((s) => [s.id, s.name])),
    [stores],
  );

  const { data: orders = [], isLoading } = useFranchiseAnalyticsOrders(
    storeIds,
    dateRange,
  );

  const salesData = useMemo(
    () => aggregateSalesByPeriod(orders, period),
    [orders, period],
  );
  const storeComparison = useMemo(
    () => aggregateByStore(orders, storeMap),
    [orders, storeMap],
  );

  const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrders = orders.length;
  const avgStoreSales = stores.length > 0 ? totalSales / stores.length : 0;

  const kpis = [
    {
      label: "전체 매출",
      value: `${totalSales.toLocaleString("ko-KR")}원`,
      icon: WonIcon,
    },
    {
      label: "전체 주문",
      value: `${totalOrders.toLocaleString()}건`,
      icon: ShoppingCartIcon,
    },
    {
      label: "매장 수",
      value: `${stores.length}개`,
      icon: StoreIcon,
    },
    {
      label: "평균 매장 매출",
      value: `${Math.round(avgStoreSales).toLocaleString("ko-KR")}원`,
      icon: ReceiptIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{"본사 통합 매출"}</h1>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Store Comparison */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"매장별 매출 비교"}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => exportStoreComparison(storeComparison)}
            disabled={storeComparison.length === 0}
          >
            <DownloadIcon className="size-3" />
            {"CSV"}
          </Button>
        </CardHeader>
        <CardContent>
          <StoreComparisonChart data={storeComparison} />
        </CardContent>
      </Card>

      {/* Sales Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"전체 매출 추이"}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => exportSalesReport(salesData, "전체")}
            disabled={salesData.length === 0}
          >
            <DownloadIcon className="size-3" />
            {"CSV"}
          </Button>
        </CardHeader>
        <CardContent>
          <PeriodTabs value={period} onChange={setPeriod} />
          <div className="mt-4">
            <SalesChart data={salesData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
