"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsap<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    ctxRef.current = gsap.context(() => {}, ref.current);

    return () => {
      ctxRef.current?.revert();
    };
  }, []);

  const ctx = (fn: () => void) => {
    if (ctxRef.current) {
      ctxRef.current.add(fn);
    }
  };

  return { ref, ctx };
}

export { gsap, ScrollTrigger };
