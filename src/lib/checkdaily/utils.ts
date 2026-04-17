import type { CheckDailyItemType, LogtimeStatus } from "@/lib/models/CheckDaily";

export const CHECK_DAILY_ITEM_TYPES: CheckDailyItemType[] = [
  "logtime",
  "meeting",
  "report",
  "task_planning",
];

export function getTodayDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getNextWorkingDate(date = new Date()): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function evaluateLogtimeStatus(actualHours: number, expectedHours: number): LogtimeStatus {
  if (actualHours <= 0) return "Not logged";
  if (actualHours < expectedHours) return "Missing";
  return "OK";
}
