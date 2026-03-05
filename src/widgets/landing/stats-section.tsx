"use client";

import { useCounterAnimation } from "@/shared/lib/use-counter-animation";
import { useScrollReveal } from "@/shared/lib/use-scroll-reveal";

const stats = [
  { end: 3200, suffix: "+", label: "가맹점 도입", prefix: "" },
  { end: 50, suffix: "만+", label: "월간 주문 처리", prefix: "" },
  { end: 3, suffix: "초", label: "평균 주문 시간", prefix: "" },
  { end: 99.9, suffix: "%", label: "시스템 가동률", prefix: "" },
];

function StatCard({
  end,
  suffix,
  label,
  prefix,
}: {
  end: number;
  suffix: string;
  label: string;
  prefix: string;
}) {
  const { ref, displayed } = useCounterAnimation(end, 2, suffix, prefix);

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-8 text-center">
      <span
        ref={ref}
        className="text-4xl font-extrabold tracking-tight text-primary md:text-5xl"
      >
        {displayed}
      </span>
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function StatsSection() {
  const containerRef = useScrollReveal({ stagger: 0.1 });

  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {"실적"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {"숫자로 증명합니다"}
          </h2>
        </div>

        <div
          ref={containerRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
