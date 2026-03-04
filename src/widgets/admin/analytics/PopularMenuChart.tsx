"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui";
import type { MenuRankingItem } from "@/entities/order/model/types";

const chartConfig = {
  totalQuantity: {
    label: "판매수량",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface PopularMenuChartProps {
  data: MenuRankingItem[];
  limit?: number;
}

export function PopularMenuChart({ data, limit = 10 }: PopularMenuChartProps) {
  const chartData = data.slice(0, limit).map((item) => ({
    ...item,
    name: item.menuName.length > 8 ? item.menuName.slice(0, 8) + "…" : item.menuName,
    fullName: item.menuName,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        {"데이터가 없습니다"}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={80}
          fontSize={12}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <span>
                  {item.payload.fullName}{": "}{Number(value).toLocaleString()}{"개"}
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="totalQuantity"
          fill="var(--color-totalQuantity)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
