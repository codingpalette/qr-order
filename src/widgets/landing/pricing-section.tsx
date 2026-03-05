"use client";

import { useState } from "react";
import { useScrollReveal } from "@/shared/lib/use-scroll-reveal";
import { Button } from "@/shared/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ConsultationModal } from "./consultation-modal";

const plans = [
  {
    name: "무료체험",
    price: "0",
    period: "14일간",
    description: "부담 없이 모든 기능을 체험해보세요",
    features: [
      "QR 주문 기본 기능",
      "메뉴 관리 (최대 30개)",
      "실시간 주문 알림",
      "기본 매출 리포트",
      "이메일 지원",
    ],
    cta: "무료로 시작하기",
    popular: false,
  },
  {
    name: "스탠다드",
    price: "49,000",
    period: "월",
    description: "성장하는 매장을 위한 최적의 플랜",
    features: [
      "QR 주문 전체 기능",
      "무제한 메뉴 관리",
      "실시간 주문 알림",
      "상세 매출 분석 리포트",
      "테이블 관리 시스템",
      "멀티 디바이스 지원",
      "우선 채팅 지원",
    ],
    cta: "스탠다드 시작하기",
    popular: true,
  },
  {
    name: "프리미엄",
    price: "99,000",
    period: "월",
    description: "다매장 운영과 고급 분석이 필요한 브랜드",
    features: [
      "스탠다드 플랜 전체 기능",
      "다매장 통합 관리",
      "고급 데이터 분석 & AI 추천",
      "커스텀 브랜딩",
      "POS 연동",
      "API 액세스",
      "전담 매니저 배정",
    ],
    cta: "프리미엄 시작하기",
    popular: false,
  },
];

export function PricingSection() {
  const containerRef = useScrollReveal({ stagger: 0.1 });
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {"요금제"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {"매장 규모에 맞는 플랜을 선택하세요"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {"모든 플랜에 14일 무료 체험이 포함되어 있습니다. 언제든지 플랜을 변경하거나 해지할 수 있습니다."}
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-8",
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border/60",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  {"인기"}
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                {plan.price !== "0" && (
                  <span className="text-sm text-muted-foreground">{"₩"}</span>
                )}
                <span className="text-4xl font-extrabold tracking-tight text-foreground">
                  {plan.price === "0" ? "무료" : plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.price === "0" ? `/ ${plan.period}` : `/ ${plan.period}`}
                </span>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => setConsultationOpen(true)}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <ConsultationModal open={consultationOpen} onOpenChange={setConsultationOpen} />
    </section>
  );
}
