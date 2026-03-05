"use client";

import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "./use-gsap";

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {},
) {
  const ref = useRef<T>(null);

  const {
    y = 40,
    x = 0,
    opacity = 0,
    duration = 0.8,
    delay = 0,
    stagger = 0,
    once = true,
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const targets = stagger
      ? ref.current.children
      : ref.current;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        x,
        opacity,
        duration,
        delay,
        stagger: stagger || undefined,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: once
            ? "play none none none"
            : "play none none reverse",
        },
      });
    }, ref.current);

    return () => ctx.revert();
  }, [y, x, opacity, duration, delay, stagger, once]);

  return ref;
}
