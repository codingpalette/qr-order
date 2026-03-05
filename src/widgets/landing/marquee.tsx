import { cn } from "@/shared/lib/utils";
import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  reverse?: boolean;
}

export function Marquee({
  children,
  className,
  speed = 40,
  reverse = false,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "marquee-container overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "marquee-track flex w-max gap-12",
          reverse ? "marquee-reverse" : "marquee-forward",
        )}
        style={
          { "--marquee-speed": `${speed}s` } as React.CSSProperties
        }
      >
        {/* Original + duplicate for seamless loop */}
        {children}
        {children}
      </div>
    </div>
  );
}
