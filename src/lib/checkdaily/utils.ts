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

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getPreviousWorkingDateKey(dateKey: string): string {
  const previous = parseDateKey(dateKey);
  previous.setDate(previous.getDate() - 1);
  while (previous.getDay() === 0 || previous.getDay() === 6) {
    previous.setDate(previous.getDate() - 1);
  }
  return formatDateKey(previous);
}

export function calculateCheckDailyStreak(
  completedDates: Set<string>,
  todayDateKey: string,
  isTodayCompleted: boolean
): number {
  let streak = 0;
  let cursor = isTodayCompleted ? todayDateKey : getPreviousWorkingDateKey(todayDateKey);

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = getPreviousWorkingDateKey(cursor);
  }

  return streak;
}
