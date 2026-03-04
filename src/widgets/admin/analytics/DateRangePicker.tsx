"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { DateRange as RDPDateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  type DateRange,
  type PresetRange,
  getPresetDateRange,
  getPresetLabel,
} from "@/shared/lib/date-utils";

const PRESETS: PresetRange[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
];

const LABEL_TO_PRESET = Object.fromEntries(
  PRESETS.map((p) => [getPresetLabel(p), p]),
) as Record<string, PresetRange>;

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) {
  const handlePreset = useCallback(
    (label: string | null) => {
      if (label) {
        const preset = LABEL_TO_PRESET[label];
        if (preset) {
          onDateRangeChange(getPresetDateRange(preset));
        }
      }
    },
    [onDateRangeChange],
  );

  const handleCalendarSelect = useCallback(
    (range: RDPDateRange | undefined) => {
      if (range?.from) {
        onDateRangeChange({
          from: range.from,
          to: range.to ?? range.from,
        });
      }
    },
    [onDateRangeChange],
  );

  const calendarRange: RDPDateRange = {
    from: dateRange.from,
    to: dateRange.to,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select onValueChange={handlePreset}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="기간 선택" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset} value={getPresetLabel(preset)}>
              {getPresetLabel(preset)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground",
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "yyyy.MM.dd", { locale: ko })}
                {" - "}
                {format(dateRange.to, "yyyy.MM.dd", { locale: ko })}
              </>
            ) : (
              format(dateRange.from, "yyyy.MM.dd", { locale: ko })
            )
          ) : (
            "날짜를 선택하세요"
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={calendarRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={ko}
            defaultMonth={dateRange.from}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
