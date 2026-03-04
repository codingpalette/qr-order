"use client";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui";
import type { AnalyticsPeriod } from "@/entities/order/model/types";

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "일별" },
  { value: "weekly", label: "주별" },
  { value: "monthly", label: "월별" },
];

interface PeriodTabsProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
  children?: React.ReactNode;
}

export function PeriodTabs({ value, onChange, children }: PeriodTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as AnalyticsPeriod)}>
      <TabsList>
        {PERIOD_OPTIONS.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value}>
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
