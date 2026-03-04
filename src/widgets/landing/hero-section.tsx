"use client";

import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Play, Monitor, Smartphone, UtensilsCrossed } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  CustomerMenuPreview,
  KdsPreview,
  MenuManagementPreview,
} from "./previews";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pb-16 pt-20 md:pb-24 md:pt-28">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 size-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-40 size-[400px] rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <Badge
            variant="outline"
            className="mb-6 gap-1.5 border-primary/20 bg-accent px-4 py-1.5 text-sm text-primary"
          >
            <span>{"🚀"}</span>
            <span>{"프랜차이즈 QR 오더 솔루션"}</span>
          </Badge>

          {/* Headline */}
          <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {"프랜차이즈 본사와 가맹점을 모두 만족시키는 "}
            <span className="text-primary">{"완벽한 QR 오더"}</span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {
              "본사의 메뉴 통제권은 유지하면서, 가맹점의 독립적인 정산과 자체 메뉴 운영을 보장합니다. 앱 설치 없이 3초 만에 주문하는 혁신을 경험하세요."
            }
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base">
              {"무료로 시작하기"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 gap-2 px-8 text-base"
            >
              <Play className="size-4" />
              {"데모 체험하기"}
            </Button>
          </div>

          {/* Dashboard Preview */}
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

const previews = [
  {
    key: "customer",
    label: "고객 주문 화면",
    icon: Smartphone,
    preview: CustomerMenuPreview,
  },
  {
    key: "kds",
    label: "주방 디스플레이",
    icon: Monitor,
    preview: KdsPreview,
  },
  {
    key: "admin",
    label: "메뉴 관리",
    icon: UtensilsCrossed,
    preview: MenuManagementPreview,
  },
] as const;

function DashboardPreview() {
  const [active, setActive] = useState(0);
  const ActivePreview = previews[active].preview;

  return (
    <div className="mt-16 w-full max-w-5xl">
      {/* Tab Buttons */}
      <div className="mb-4 flex justify-center gap-2">
        {previews.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setActive(i)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              active === i
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <p.icon className="size-4" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Live Preview */}
      <div className="relative rounded-xl border border-border bg-card p-2 shadow-2xl shadow-primary/10">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          <div
            className="pointer-events-none absolute inset-0 select-none origin-top-left"
            style={{ transform: "scale(0.55)", width: "182%", height: "182%" }}
          >
            <ActivePreview />
          </div>
        </div>
      </div>
    </div>
  );
}
