"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  Volume2Icon,
  VolumeOffIcon,
  MaximizeIcon,
  MinimizeIcon,
  MonitorIcon,
} from "lucide-react";

interface KdsHeaderProps {
  isConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function KdsHeader({
  isConnected,
  soundEnabled,
  onToggleSound,
}: KdsHeaderProps) {
  const [now, setNow] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-gray-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <MonitorIcon className="size-5 text-orange-400" />
        <h1 className="text-lg font-bold">{"주방 디스플레이"}</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-gray-800 px-2.5 py-1">
          <div
            className={cn(
              "size-2 rounded-full",
              isConnected ? "bg-green-400" : "bg-red-400",
            )}
          />
          <span className="text-xs text-gray-300">
            {isConnected ? "연결됨" : "연결 끊김"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="mr-2 font-mono text-sm tabular-nums text-gray-300">
          {now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={onToggleSound}
        >
          {soundEnabled ? (
            <Volume2Icon className="size-4" />
          ) : (
            <VolumeOffIcon className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <MinimizeIcon className="size-4" />
          ) : (
            <MaximizeIcon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
