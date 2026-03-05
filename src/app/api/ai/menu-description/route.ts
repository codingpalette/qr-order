import { NextRequest, NextResponse } from "next/server";
import { anthropic, aiErrorResponse } from "../route-utils";

export async function POST(request: NextRequest) {
  try {
    const { name, categoryName, price, costPrice } = await request.json();

    if (!name || !categoryName) {
      return NextResponse.json(
        { error: "메뉴명과 카테고리는 필수입니다." },
        { status: 400 },
      );
    }

    const priceInfo = price ? `${Number(price).toLocaleString("ko-KR")}원` : "";
    const costInfo = costPrice ? ` (원가: ${Number(costPrice).toLocaleString("ko-KR")}원)` : "";

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `당신은 음식점 메뉴 설명 전문 카피라이터입니다.
다음 메뉴에 대해 매력적인 설명을 2-3문장으로 작성해주세요.
재료, 맛, 식감을 강조하고 고객의 식욕을 자극하는 표현을 사용하세요.

메뉴명: ${name}
카테고리: ${categoryName}
${priceInfo ? `가격: ${priceInfo}${costInfo}` : ""}

설명만 작성하고, 다른 부가 설명은 하지 마세요.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const description = textBlock?.text ?? "";

    return NextResponse.json({ description });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
