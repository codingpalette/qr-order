"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStaffCalls, useAcknowledgeStaffCall } from "@/features/staff-call";
import { useStaffCallsRealtime } from "@/shared/hooks/useStaffCallsRealtime";
import { useNotificationSound } from "@/shared/hooks/useNotificationSound";
import { useToast } from "@/shared/ui/toast";
import { Button } from "@/shared/ui";
import { BellRingIcon, CheckIcon } from "lucide-react";
import type { StaffCall } from "@/features/staff-call";

interface StaffCallBannerProps {
  storeId: string | null;
  soundEnabled?: boolean;
}

function timeAgo(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  return `${Math.floor(diff / 60)}분 전`;
}

export function StaffCallBanner({ storeId, soundEnabled = true }: StaffCallBannerProps) {
  const { data: calls = [] } = useStaffCalls(storeId);
  const acknowledge = useAcknowledgeStaffCall();
  const { play } = useNotificationSound();
  const { toast } = useToast();
  const prevCountRef = useRef(calls.length);

  const onNewCall = useCallback(
    (call: StaffCall) => {
      if (soundEnabled) {
        play("staffCall");
      }
      toast({
        type: "info",
        title: "직원 호출",
        description: `테이블 ${call.table_number}번에서 직원을 호출했습니다.`,
      });
    },
    [soundEnabled, play, toast],
  );

  useStaffCallsRealtime({ storeId, onNewCall });

  // Play sound when calls increase via query refetch (fallback)
  useEffect(() => {
    if (calls.length > prevCountRef.current && soundEnabled) {
      play("staffCall");
    }
    prevCountRef.current = calls.length;
  }, [calls.length, soundEnabled, play]);

  if (calls.length === 0) return null;

  return (
    <div className="space-y-2">
      {calls.map((call) => (
        <div
          key={call.id}
          className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <BellRingIcon className="size-4 text-orange-600 shrink-0" />
            <span className="text-sm font-medium text-orange-900">
              {"테이블 "}
              {call.table_number}
              {"번 호출"}
            </span>
            <span className="text-xs text-orange-600">
              {timeAgo(call.created_at)}
            </span>
          </div>
          <Button
            size="xs"
            variant="outline"
            className="gap-1"
            onClick={() => acknowledge.mutate(call.id)}
            disabled={acknowledge.isPending}
          >
            <CheckIcon className="size-3" />
            {"확인"}
          </Button>
        </div>
      ))}
    </div>
  );
}
