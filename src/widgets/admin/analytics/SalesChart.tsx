"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui";
import type { SalesDataPoint } from "@/entities/order/model/types";

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

interface SalesChartProps {
  data: SalesDataPoint[];
}

export function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        {"데이터가 없습니다"}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          tickFormatter={(v) =>
            v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v.toLocaleString()
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const label = name === "totalSales" ? "매출" : "주문수";
                const formatted =
                  name === "totalSales"
                    ? `${Number(value).toLocaleString("ko-KR")}원`
                    : `${value}건`;
                return (
                  <span>
                    {label}{": "}{formatted}
                  </span>
                );
              }}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="totalSales"
          stroke="var(--color-totalSales)"
          fill="var(--color-totalSales)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
