import { NextRequest, NextResponse } from "next/server";
import { anthropic, aiErrorResponse } from "../route-utils";

export async function POST(request: NextRequest) {
  try {
    const { cartItems, currentHour, menuList } = await request.json();

    if (!menuList || menuList.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const cartInfo =
      cartItems && cartItems.length > 0
        ? `현재 장바구니: ${cartItems.map((c: { name: string; price: number }) => `${c.name}(${c.price.toLocaleString("ko-KR")}원)`).join(", ")}`
        : "장바구니가 비어있습니다.";

    const menuInfo = menuList
      .map(
        (m: { id: string; name: string; description: string | null; price: number; categoryName: string }) =>
          `[${m.id}] ${m.name} (${m.categoryName}) - ${m.price.toLocaleString("ko-KR")}원${m.description ? `: ${m.description}` : ""}`,
      )
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `당신은 음식 추천 전문가입니다. 고객에게 메뉴를 추천해주세요.

현재 시간: ${currentHour}시
${cartInfo}

## 메뉴 목록
${menuInfo}

위 정보를 바탕으로 3~5개의 메뉴를 추천해주세요.
시간대에 어울리는 메뉴, 장바구니와 잘 어울리는 페어링 메뉴를 추천하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{"recommendations": [{"menuId": "메뉴ID", "reason": "추천 이유 한 줄"}]}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text ?? "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ recommendations: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      recommendations: parsed.recommendations ?? [],
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
