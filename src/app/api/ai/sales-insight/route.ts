import { NextRequest } from "next/server";
import { anthropic, aiErrorResponse } from "../route-utils";

export async function POST(request: NextRequest) {
  try {
    const { salesData, menuRanking, hourlyData, period, kpis } =
      await request.json();

    const prompt = `당신은 외식업 데이터 분석 전문가입니다.
아래 매출 데이터를 분석하여 핵심 인사이트를 마크다운 형식으로 제공해주세요.

## 분석 기간: ${period === "daily" ? "일별" : period === "weekly" ? "주별" : "월별"}

## KPI 요약
- 총 매출: ${kpis.totalSales?.toLocaleString("ko-KR") ?? 0}원
- 주문 수: ${kpis.orderCount ?? 0}건
- 평균 객단가: ${Math.round(kpis.avgOrderValue ?? 0).toLocaleString("ko-KR")}원
- 완료율: ${kpis.completionRate ?? "100%"}

## 매출 추이 데이터
${JSON.stringify(salesData?.slice(-14) ?? [], null, 2)}

## 인기 메뉴 (상위 10개)
${JSON.stringify(menuRanking?.slice(0, 10) ?? [], null, 2)}

## 시간대별 주문 분포
${JSON.stringify(hourlyData?.filter((h: { orderCount: number }) => h.orderCount > 0) ?? [], null, 2)}

다음 항목을 포함해 분석해주세요:
1. **핵심 트렌드** - 매출 흐름의 주요 패턴
2. **피크 타임 분석** - 가장 활발한 시간대와 활용 방안
3. **메뉴 전략** - 인기 메뉴 기반 추천
4. **개선 제안** - 매출 향상을 위한 실행 가능한 제안 2-3개

간결하고 실용적으로 작성하세요.`;

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
