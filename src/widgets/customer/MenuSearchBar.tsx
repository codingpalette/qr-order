"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface MenuSearchBarProps {
  onSearch: (query: string) => void;
}

export function MenuSearchBar({ onSearch }: MenuSearchBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [value, onSearch]);

  const handleClear = () => {
    setValue("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
        <Search className="size-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="메뉴 검색"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {value && (
          <button
            onClick={handleClear}
            className="flex size-5 items-center justify-center rounded-full bg-gray-300 text-white"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}
