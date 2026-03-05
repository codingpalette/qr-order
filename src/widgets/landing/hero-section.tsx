"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Play } from "lucide-react";
import { gsap, ScrollTrigger } from "@/shared/lib/use-gsap";
import { DeviceFrame } from "./device-frame";
import { CustomerMenuPreview } from "./previews";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-hero-word]", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
      })
        .from(
          "[data-hero-sub]",
          { y: 30, opacity: 0, duration: 0.6 },
          "-=0.3",
        )
        .from(
          "[data-hero-cta]",
          { y: 20, opacity: 0, scale: 0.95, duration: 0.5 },
          "-=0.2",
        )
        .from(
          "[data-hero-device]",
          {
            y: 80,
            opacity: 0,
            rotateX: 8,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.4",
        );

      // Parallax on blobs
      gsap.to("[data-blob-1]", {
        y: -60,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to("[data-blob-2]", {
        y: -30,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef.current);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-background pt-20"
    >
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-blob-1
          className="animate-blob absolute -right-40 -top-40 size-[600px] rounded-full bg-primary/[0.07] blur-3xl"
        />
        <div
          data-blob-2
          className="animate-blob-delay absolute -bottom-20 -left-40 size-[400px] rounded-full bg-accent/40 blur-3xl"
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 py-20">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-20">
          {/* Left: Text content */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="text-display text-foreground" style={{ perspective: "600px" }}>
              <span data-hero-word className="inline-block">
                {"프랜차이즈"}
              </span>{" "}
              <span data-hero-word className="inline-block">
                {"본사와"}
              </span>{" "}
              <span data-hero-word className="inline-block">
                {"가맹점을"}
              </span>
              <br className="hidden sm:inline" />{" "}
              <span data-hero-word className="inline-block">
                {"모두"}
              </span>{" "}
              <span data-hero-word className="inline-block">
                {"만족시키는"}
              </span>
              <br />{" "}
              <span data-hero-word className="inline-block text-primary">
                {"완벽한 QR 오더"}
              </span>
            </h1>

            <p
              data-hero-sub
              className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              {"본사의 메뉴 통제권은 유지하면서, 가맹점의 독립적인 정산과 자체 메뉴 운영을 보장합니다. 앱 설치 없이 3초 만에 주문하는 혁신을 경험하세요."}
            </p>

            <div data-hero-cta className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="h-13 px-8 text-base">
                {"무료로 시작하기"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-13 gap-2 px-8 text-base"
              >
                <Play className="size-4" />
                {"데모 체험하기"}
              </Button>
            </div>
          </div>

          {/* Right: Device mockup */}
          <div data-hero-device className="flex flex-1 items-center justify-center">
            <DeviceFrame type="phone" className="shadow-2xl shadow-primary/20">
              <CustomerMenuPreview />
            </DeviceFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
