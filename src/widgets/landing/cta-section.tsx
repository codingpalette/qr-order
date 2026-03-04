import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-16 text-center md:px-16 md:py-20">
          {/* Subtle decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 size-[300px] rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 size-[300px] rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold text-background md:text-4xl">
              {"지금 바로 우리 매장에 스마트함을 더하세요."}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-background/70">
              {
                "무료 상담을 통해 우리 매장에 딱 맞는 QR 오더 도입 방안을 안내 받으세요."
              }
            </p>
            <Button
              size="lg"
              className="mt-8 h-12 gap-2 bg-background px-8 text-base text-foreground hover:bg-background/90"
            >
              {"도입 문의하기"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
