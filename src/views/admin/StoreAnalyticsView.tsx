"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import {
  useAnalyticsOrders,
  useAnalyticsOrderItems,
} from "@/entities/order/api/useAnalyticsOrders";
import {
  aggregateSalesByPeriod,
  aggregateMenuRanking,
  aggregateByHour,
  aggregateByTable,
} from "@/entities/order/lib/aggregations";
import {
  DateRangePicker,
  PeriodTabs,
  SalesChart,
  PopularMenuChart,
  HourlyOrderChart,
  TableRevenueTable,
  AISalesInsight,
} from "@/widgets/admin/analytics";
import { exportSalesReport, exportMenuRanking } from "@/features/analytics-export/lib/csv-export";
import { type DateRange, getDefaultDateRange } from "@/shared/lib/date-utils";
import type { AnalyticsPeriod } from "@/entities/order/model/types";
import {
  ShoppingCartIcon,
  ReceiptIcon,
  CheckCircleIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

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

export function StoreAnalyticsView() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");

  const { data: orders = [], isLoading: ordersLoading } = useAnalyticsOrders(
    storeId,
    dateRange,
  );

  const orderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const { data: items = [], isLoading: itemsLoading } =
    useAnalyticsOrderItems(orderIds);

  const isLoading = ordersLoading || itemsLoading;

  const salesData = useMemo(
    () => aggregateSalesByPeriod(orders, period),
    [orders, period],
  );
  const menuRanking = useMemo(() => aggregateMenuRanking(items), [items]);
  const hourlyData = useMemo(() => aggregateByHour(orders), [orders]);
  const tableData = useMemo(() => aggregateByTable(orders), [orders]);

  const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const kpis = [
    {
      label: "총 매출",
      value: `${totalSales.toLocaleString("ko-KR")}원`,
      icon: WonIcon,
    },
    {
      label: "주문 수",
      value: `${totalOrders.toLocaleString()}건`,
      icon: ShoppingCartIcon,
    },
    {
      label: "평균 객단가",
      value: `${Math.round(avgOrderValue).toLocaleString("ko-KR")}원`,
      icon: ReceiptIcon,
    },
    {
      label: "완료율",
      value: "100%",
      sub: "완료 주문 기준",
      icon: CheckCircleIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{"매출 통계"}</h1>
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
              {kpi.sub && (
                <p className="text-muted-foreground text-xs mt-1">{kpi.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insight */}
      <AISalesInsight
        salesData={salesData}
        menuRanking={menuRanking}
        hourlyData={hourlyData}
        period={period}
        kpis={{
          totalSales,
          orderCount: totalOrders,
          avgOrderValue,
          completionRate: "100%",
        }}
      />

      {/* Sales Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"매출 추이"}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => exportSalesReport(salesData, "매장")}
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

      {/* 2-Column: Popular Menu + Hourly */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{"인기 메뉴 랭킹"}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => exportMenuRanking(menuRanking, "매장")}
              disabled={menuRanking.length === 0}
            >
              <DownloadIcon className="size-3" />
              {"CSV"}
            </Button>
          </CardHeader>
          <CardContent>
            <PopularMenuChart data={menuRanking} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{"시간대별 주문"}</CardTitle>
          </CardHeader>
          <CardContent>
            <HourlyOrderChart data={hourlyData} />
          </CardContent>
        </Card>
      </div>

      {/* Table Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>{"테이블별 매출"}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableRevenueTable data={tableData} />
        </CardContent>
      </Card>
    </div>
  );
}
