"use client";

import { useRef, useEffect, useState } from "react";
import { gsap, ScrollTrigger } from "./use-gsap";

export function useCounterAnimation(
  end: number,
  duration: number = 2,
  suffix: string = "",
  prefix: string = "",
) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    if (!ref.current) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setDisplayed(`${prefix}${end.toLocaleString("ko-KR")}${suffix}`);
      return;
    }

    const obj = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: end,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          setDisplayed(
            `${prefix}${Math.round(obj.val).toLocaleString("ko-KR")}${suffix}`,
          );
        },
      });
    }, ref.current);

    return () => ctx.revert();
  }, [end, duration, suffix, prefix]);

  return { ref, displayed };
}
