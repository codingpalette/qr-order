"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "notification-sound-enabled";

function getStoredEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function useNotificationSound() {
  const [enabled, setEnabledState] = useState(getStoredEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback(
    (frequency: number, duration: number, ctx: AudioContext, startTime: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    },
    [],
  );

  const play = useCallback(
    (type: "newOrder" | "statusChange" | "staffCall") => {
      if (!enabled) return;
      try {
        const ctx = getContext();
        const now = ctx.currentTime;
        if (type === "newOrder") {
          // 3 ascending beeps
          playBeep(800, 0.15, ctx, now);
          playBeep(1000, 0.15, ctx, now + 0.18);
          playBeep(1200, 0.2, ctx, now + 0.36);
        } else if (type === "staffCall") {
          // Bell-like pattern: high-low-high
          playBeep(1000, 0.15, ctx, now);
          playBeep(1200, 0.15, ctx, now + 0.18);
          playBeep(1000, 0.2, ctx, now + 0.36);
        } else {
          // Single short beep
          playBeep(600, 0.12, ctx, now);
        }
      } catch {
        // Audio not available
      }
    },
    [enabled, getContext, playBeep],
  );

  // Resume AudioContext on first user interaction
  useEffect(() => {
    const resume = () => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    };
    document.addEventListener("click", resume, { once: true });
    return () => document.removeEventListener("click", resume);
  }, []);

  return { play, enabled, setEnabled };
}
