"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type {
  SalesDataPoint,
  MenuRankingItem,
  HourlyDataPoint,
  AnalyticsPeriod,
} from "@/entities/order/model/types";

interface AISalesInsightProps {
  salesData: SalesDataPoint[];
  menuRanking: MenuRankingItem[];
  hourlyData: HourlyDataPoint[];
  period: AnalyticsPeriod;
  kpis: {
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
    completionRate: string;
  };
}

export function AISalesInsight({
  salesData,
  menuRanking,
  hourlyData,
  period,
  kpis,
}: AISalesInsightProps) {
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsight = useCallback(async () => {
    setIsLoading(true);
    setInsight("");
    setHasGenerated(true);

    try {
      const res = await fetch("/api/ai/sales-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesData, menuRanking, hourlyData, period, kpis }),
      });

      if (!res.ok) {
        const err = await res.json();
        setInsight(`분석 실패: ${err.error ?? "알 수 없는 오류"}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setInsight(text);
      }
    } catch {
      setInsight("AI 분석 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [salesData, menuRanking, hourlyData, period, kpis]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-violet-500" />
          {"AI 매출 인사이트"}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={generateInsight}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          {isLoading ? "분석 중..." : hasGenerated ? "다시 분석" : "AI 분석"}
        </Button>
      </CardHeader>
      <CardContent>
        {!hasGenerated ? (
          <p className="text-sm text-muted-foreground">
            {"AI 분석 버튼을 클릭하면 매출 데이터를 자동으로 분석합니다."}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {insight.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return (
                  <h3 key={i} className="mt-3 mb-1 text-sm font-bold">
                    {line.replace("## ", "")}
                  </h3>
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h4 key={i} className="mt-2 mb-1 text-sm font-semibold">
                    {line.replace("### ", "")}
                  </h4>
                );
              }
              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <p key={i} className="my-0.5 pl-3 text-sm text-muted-foreground">
                    {"• "}{line.replace(/^[-*]\s/, "")}
                  </p>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <p key={i} className="my-1 text-sm font-semibold">
                    {line.replace(/\*\*/g, "")}
                  </p>
                );
              }
              if (line.trim() === "") return <div key={i} className="h-2" />;
              return (
                <p key={i} className="my-0.5 text-sm text-muted-foreground">
                  {line}
                </p>
              );
            })}
            {isLoading && (
              <span className="inline-block size-2 animate-pulse rounded-full bg-violet-500" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
