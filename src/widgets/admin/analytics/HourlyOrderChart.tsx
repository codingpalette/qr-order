"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui";
import type { HourlyDataPoint } from "@/entities/order/model/types";

const chartConfig = {
  orderCount: {
    label: "주문수",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

interface HourlyOrderChartProps {
  data: HourlyDataPoint[];
}

export function HourlyOrderChart({ data }: HourlyOrderChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: `${d.hour}시`,
  }));

  if (chartData.every((d) => d.orderCount === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        {"데이터가 없습니다"}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          interval={2}
        />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <span>
                  {item.payload.label}{" "}
                  {Number(value).toLocaleString()}{"건"}
                  {" ("}
                  {item.payload.totalSales.toLocaleString("ko-KR")}
                  {"원)"}
                </span>
              )}
            />
          }
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
