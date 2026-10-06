import type { JudgementHistoryItem } from "../types/api.ts";

export interface RecordRange { from: string; to: string }

export function kstDate(value: string | Date): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() + 9 * 60 * 60_000).toISOString().slice(0, 10);
}

export function shiftDate(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function recentRange(today: string): RecordRange {
  return { from: shiftDate(today, -6), to: shiftDate(today, 1) };
}

export function previousRange(previousDate: string, from: string): RecordRange | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(previousDate) || kstDate(`${previousDate}T00:00:00+09:00`) !== previousDate || previousDate >= from) return undefined;
  return { from: shiftDate(previousDate, -6), to: shiftDate(previousDate, 1) };
}

export function attendanceWeek(today: string) {
  const monday = shiftDate(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
  return ["월", "화", "수", "목", "금", "토", "일"].map((label, index) => {
    const key = shiftDate(monday, index);
    return { label, key, isToday: key === today, future: key > today };
  });
}

export function groupRecords<T>(items: T[], date: (item: T) => string, today: string, selectedDate: string | null) {
  const monday = attendanceWeek(today)[0].key;
  const groups = new Map<string, { key: string; label: string; items: T[] }>();
  for (const item of [...items].sort((a, b) => date(b).localeCompare(date(a)))) {
    const day = kstDate(date(item));
    if (!day || (selectedDate && day !== selectedDate)) continue;
    const key = day === today ? "today" : day === shiftDate(today, -1) ? "yesterday" : day >= monday && day <= today ? "week" : "older";
    const label = key === "today" ? "오늘" : key === "yesterday" ? "어제" : key === "week" ? "이번 주" : "지난 기록";
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()];
}

export function judgementSummary(items: JudgementHistoryItem[]) {
  return {
    total: items.length,
    hits: items.filter((item) => item.correct === true && Boolean(item.actualResult) && item.actualResult !== "UNKNOWN").length,
    pending: items.filter((item) => !item.actualResult).length,
    unavailable: items.filter((item) => item.actualResult === "UNKNOWN").length
  };
}
