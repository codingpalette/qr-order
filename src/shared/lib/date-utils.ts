export interface DateRange {
  from: Date;
  to: Date;
}

export type PresetRange =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth";

const PRESET_LABELS: Record<PresetRange, string> = {
  today: "오늘",
  yesterday: "어제",
  last7: "최근 7일",
  last30: "최근 30일",
  thisMonth: "이번 달",
  lastMonth: "지난 달",
};

export function getPresetLabel(preset: PresetRange): string {
  return PRESET_LABELS[preset];
}

export function getPresetDateRange(preset: PresetRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: now };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: today };
    }
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: now };
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: now };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: now };
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
      return { from, to };
    }
  }
}

export function getDefaultDateRange(): DateRange {
  return getPresetDateRange("last30");
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
