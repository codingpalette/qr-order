"use client";

import { useCallback, useSyncExternalStore } from "react";
import { cn } from "@/shared/lib/utils";
import { XIcon, ShoppingBagIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react";

// --- Toast Store ---

type ToastType = "success" | "error" | "info" | "order";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

let toasts: Toast[] = [];
let listeners: Array<() => void> = [];

function emit() {
  listeners.forEach((l) => l());
}

function addToast(toast: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2, 9);
  const duration = toast.duration ?? (toast.type === "order" ? 10000 : 5000);
  toasts = [{ ...toast, id, duration }, ...toasts];
  emit();
  setTimeout(() => {
    removeToast(id);
  }, duration);
  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return toasts;
}

// --- Hook ---

export function useToast() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toast = useCallback((opts: Omit<Toast, "id">) => {
    return addToast(opts);
  }, []);

  return { toasts: currentToasts, toast, dismiss: removeToast };
}

// --- Icons ---

const typeIcons: Record<ToastType, typeof CheckCircleIcon> = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  info: InfoIcon,
  order: ShoppingBagIcon,
};

const typeStyles: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  order: "border-orange-200 bg-orange-50 text-orange-900",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
  order: "text-orange-600",
};

// --- Renderer ---

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = typeIcons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex w-[340px] items-start gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2",
              typeStyles[t.type],
            )}
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", iconStyles[t.type])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs opacity-80">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
