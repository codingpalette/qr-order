"use client";

import { cn } from "@/shared/lib/utils";
import type { ReactNode } from "react";

interface DeviceFrameProps {
  children: ReactNode;
  type?: "phone" | "tablet";
  className?: string;
}

export function DeviceFrame({
  children,
  type = "phone",
  className,
}: DeviceFrameProps) {
  return (
    <div
      className={cn(
        "relative rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl",
        type === "phone" ? "w-[280px]" : "w-[480px]",
        className,
      )}
    >
      {/* Notch */}
      {type === "phone" && (
        <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
      )}

      {/* Screen */}
      <div
        className={cn(
          "overflow-hidden rounded-[2rem] bg-white",
          type === "phone" ? "aspect-[9/19.5]" : "aspect-[4/3]",
        )}
      >
        <div
          className="pointer-events-none h-full w-full origin-top-left select-none"
          style={{
            transform: type === "phone" ? "scale(0.746)" : "scale(0.6)",
            width: type === "phone" ? "134%" : "167%",
            height: type === "phone" ? "134%" : "167%",
          }}
        >
          {children}
        </div>
      </div>

      {/* Home indicator */}
      {type === "phone" && (
        <div className="flex justify-center pb-1 pt-1.5">
          <div className="h-1 w-24 rounded-full bg-gray-600" />
        </div>
      )}
    </div>
  );
}
