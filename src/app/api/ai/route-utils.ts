import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function aiErrorResponse(error: unknown) {
  if (error instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return NextResponse.json(
      { error: "AI 서비스 인증에 실패했습니다." },
      { status: 500 },
    );
  }
  console.error("[AI API Error]", error);
  return NextResponse.json(
    { error: "AI 응답 생성에 실패했습니다." },
    { status: 500 },
  );
}
