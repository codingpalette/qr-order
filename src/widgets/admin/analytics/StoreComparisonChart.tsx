"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/shared/ui";
import type { StoreComparisonItem } from "@/entities/order/model/types";

const chartConfig = {
  totalSales: {
    label: "매출",
    color: "var(--chart-1)",
  },
  orderCount: {
    label: "주문수",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface StoreComparisonChartProps {
  data: StoreComparisonItem[];
}

export function StoreComparisonChart({ data }: StoreComparisonChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: d.storeName.length > 6 ? d.storeName.slice(0, 6) + "…" : d.storeName,
    fullName: d.storeName,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        {"데이터가 없습니다"}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v) =>
            v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v.toLocaleString()
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const label = name === "totalSales" ? "매출" : "주문수";
                const formatted =
                  name === "totalSales"
                    ? `${Number(value).toLocaleString("ko-KR")}원`
                    : `${value}건`;
                return (
                  <span>
                    {item.payload.fullName}{" "}{label}{": "}{formatted}
                  </span>
                );
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="totalSales"
          fill="var(--color-totalSales)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="orderCount"
          fill="var(--color-orderCount)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
