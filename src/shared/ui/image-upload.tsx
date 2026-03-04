"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "./button";
import { ImageIcon, XIcon } from "lucide-react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export function ImageUpload({ value, onChange, disabled, maxSizeMB = 2 }: ImageUploadProps) {
  const maxSize = maxSizeMB * 1024 * 1024;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview ?? value ?? null;

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("PNG, JPG, WebP 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > maxSize) {
        setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange(file);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleSelect}
        disabled={disabled}
      />

      {displayUrl ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="로고 미리보기"
            className="h-24 w-24 rounded-lg border object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-24 w-24 flex-col gap-1"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <ImageIcon className="text-muted-foreground size-6" />
          <span className="text-muted-foreground text-xs">{"업로드"}</span>
        </Button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
