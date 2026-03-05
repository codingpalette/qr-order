import { NextRequest } from "next/server";
import { anthropic, aiErrorResponse } from "../route-utils";

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "add_to_cart",
    description: "고객의 장바구니에 메뉴를 추가합니다",
    input_schema: {
      type: "object" as const,
      properties: {
        menuId: { type: "string", description: "메뉴 ID" },
        menuName: { type: "string", description: "메뉴 이름" },
        quantity: { type: "number", description: "수량 (기본 1)" },
      },
      required: ["menuId", "menuName"],
    },
  },
  {
    name: "search_menu",
    description: "메뉴를 검색합니다 (이름, 카테고리, 가격대)",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "검색어" },
        maxPrice: { type: "number", description: "최대 가격" },
        category: { type: "string", description: "카테고리명" },
      },
      required: ["query"],
    },
  },
];

import type Anthropic from "@anthropic-ai/sdk";

interface MenuContext {
  menus: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    categoryName: string;
  }[];
  cartItems: { name: string; quantity: number; price: number }[];
}

function handleSearchMenu(
  input: { query: string; maxPrice?: number; category?: string },
  menuContext: MenuContext,
): string {
  let results = menuContext.menus;

  if (input.query) {
    const q = input.query.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.categoryName.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)),
    );
  }

  if (input.maxPrice) {
    results = results.filter((m) => m.price <= input.maxPrice!);
  }

  if (input.category) {
    const cat = input.category.toLowerCase();
    results = results.filter((m) => m.categoryName.toLowerCase().includes(cat));
  }

  if (results.length === 0) {
    return "검색 결과가 없습니다.";
  }

  return results
    .slice(0, 10)
    .map(
      (m) =>
        `- ${m.name} (${m.categoryName}) ${m.price.toLocaleString("ko-KR")}원${m.description ? ` - ${m.description}` : ""}`,
    )
    .join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { messages, menuContext } = await request.json();

    const menuInfo = menuContext.menus
      .map(
        (m: MenuContext["menus"][0]) =>
          `[ID:${m.id}] ${m.name} (${m.categoryName}) - ${m.price.toLocaleString("ko-KR")}원${m.description ? `: ${m.description}` : ""}`,
      )
      .join("\n");

    const cartInfo =
      menuContext.cartItems && menuContext.cartItems.length > 0
        ? menuContext.cartItems
            .map(
              (c: MenuContext["cartItems"][0]) =>
                `${c.name} x${c.quantity} (${c.price.toLocaleString("ko-KR")}원)`,
            )
            .join(", ")
        : "비어있음";

    const systemPrompt = `당신은 친절한 음식점 주문 도우미입니다. 고객이 메뉴를 고르고 주문하는 것을 도와주세요.

## 매장 메뉴
${menuInfo}

## 현재 장바구니
${cartInfo}

## 규칙
- 항상 한국어로 답변하세요
- 친근하고 간결하게 답변하세요
- 메뉴를 추천할 때는 이유를 함께 알려주세요
- 고객이 메뉴를 담고 싶어하면 add_to_cart 도구를 사용하세요
- 메뉴를 검색하려면 search_menu 도구를 사용하세요
- 가격 정보를 정확하게 안내하세요`;

    const apiMessages: Anthropic.Messages.MessageParam[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }),
    );

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      tools,
      messages: apiMessages,
    });

    const result: {
      text: string;
      toolCalls: { name: string; input: Record<string, unknown> }[];
    } = { text: "", toolCalls: [] };

    for (const block of response.content) {
      if (block.type === "text") {
        result.text += block.text;
      } else if (block.type === "tool_use") {
        if (block.name === "search_menu") {
          const searchResult = handleSearchMenu(
            block.input as { query: string; maxPrice?: number; category?: string },
            menuContext,
          );

          const followUp = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 800,
            system: systemPrompt,
            tools,
            messages: [
              ...apiMessages,
              { role: "assistant", content: response.content },
              {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: searchResult,
                  },
                ],
              },
            ],
          });

          for (const fb of followUp.content) {
            if (fb.type === "text") {
              result.text += fb.text;
            } else if (fb.type === "tool_use" && fb.name === "add_to_cart") {
              result.toolCalls.push({
                name: fb.name,
                input: fb.input as Record<string, unknown>,
              });
            }
          }
        } else if (block.name === "add_to_cart") {
          result.toolCalls.push({
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }
    }

    if (result.toolCalls.length > 0 && !result.text) {
      const addedItems = result.toolCalls
        .filter((tc) => tc.name === "add_to_cart")
        .map(
          (tc) =>
            `${tc.input.menuName}${tc.input.quantity && Number(tc.input.quantity) > 1 ? ` x${tc.input.quantity}` : ""}`,
        );
      if (addedItems.length > 0) {
        result.text = `장바구니에 ${addedItems.join(", ")}을(를) 추가했어요!`;
      }
    }

    return Response.json(result);
  } catch (error) {
    return aiErrorResponse(error);
  }
}
