"use client";

import { useScrollReveal } from "@/shared/lib/use-scroll-reveal";
import { DeviceFrame } from "./device-frame";
import type { ReactNode, ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface FeatureSectionItemProps {
  icon: ComponentType<LucideProps>;
  badge: string;
  title: string;
  description: string;
  reverse?: boolean;
  preview: ComponentType;
  deviceType?: "phone" | "tablet";
}

export function FeatureSectionItem({
  icon: Icon,
  badge,
  title,
  description,
  reverse = false,
  preview: Preview,
  deviceType = "phone",
}: FeatureSectionItemProps) {
  const textRef = useScrollReveal({ x: reverse ? 60 : -60, y: 0 });
  const deviceRef = useScrollReveal({ x: reverse ? -60 : 60, y: 0, delay: 0.15 });

  return (
    <section className="flex min-h-screen items-center overflow-hidden py-20">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div
          className={`flex flex-col items-center gap-12 md:gap-20 ${
            reverse ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          {/* Text */}
          <div ref={textRef} className="flex w-full flex-1 flex-col">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                {badge}
              </span>
            </div>
            <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          </div>

          {/* Device mockup */}
          <div ref={deviceRef} className="flex w-full flex-1 items-center justify-center">
            <DeviceFrame type={deviceType}>
              <Preview />
            </DeviceFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
