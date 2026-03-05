"use client";

import { useRef, useEffect } from "react";
import type { MenuCategory } from "@/entities/menu/model/types";
import { cn } from "@/shared/lib/utils";

interface CategoryFilterBarProps {
  categories: MenuCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilterBar({
  categories,
  selectedId,
  onSelect,
}: CategoryFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [selectedId]);

  return (
    <div className="sticky top-[65px] z-10 border-b border-gray-100 bg-white">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-2.5"
      >
        <button
          ref={selectedId === null ? activeRef : undefined}
          onClick={() => onSelect(null)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selectedId === null
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 active:bg-gray-200",
          )}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            ref={selectedId === cat.id ? activeRef : undefined}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              selectedId === cat.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-200",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
