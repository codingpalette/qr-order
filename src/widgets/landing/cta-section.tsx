"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/shared/lib/use-scroll-reveal";
import { ConsultationModal } from "./consultation-modal";

export function CTASection() {
  const ref = useScrollReveal({ y: 50 });
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gray-950">
      {/* Animated gradient background */}
      <div className="animate-gradient pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-950 via-primary/20 to-gray-950" />

      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div
        ref={ref}
        className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center"
      >
        <h2 className="text-display text-white">
          {"지금 바로"}
          <br />
          {"스마트한 매장을 시작하세요"}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/60">
          {"무료 상담을 통해 우리 매장에 딱 맞는 QR 오더 도입 방안을 안내 받으세요. 설치비 없이 바로 시작할 수 있습니다."}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="h-13 gap-2 bg-white px-8 text-base text-gray-950 hover:bg-white/90"
            onClick={() => setConsultationOpen(true)}
          >
            {"도입 문의하기"}
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-13 border-white/20 bg-transparent px-8 text-base text-white hover:bg-white/10"
          >
            {"데모 체험하기"}
          </Button>
        </div>
      </div>
      <ConsultationModal open={consultationOpen} onOpenChange={setConsultationOpen} />
    </section>
  );
}
