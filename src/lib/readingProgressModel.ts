import { kstDate } from "./historyRecords";
export const DAILY_ARTICLE_GOAL = 3;
export type DailyReadLog = Record<string, number[]>;

export function localDateKey(date: Date): string {
  return kstDate(date);
}

export function addUniqueArticleRead(log: DailyReadLog, day: string, newsId: number): DailyReadLog {
  const ids = log[day] ?? [];
  if (ids.includes(newsId)) return log;
  return { ...log, [day]: [...ids, newsId] };
}

export function countDailyReads(log: DailyReadLog, day: string): number {
  return log[day]?.length ?? 0;
}

export function isAttendanceComplete(log: DailyReadLog, day: string): boolean {
  return countDailyReads(log, day) >= DAILY_ARTICLE_GOAL;
}

export function resumeLearningIds(log: DailyReadLog, completedNewsIds: number[]): number[] {
  const completed = new Set(completedNewsIds);
  const recent = Object.keys(log).sort().reverse().flatMap((day) => [...log[day]].reverse());
  return [...new Set(recent)].filter((id) => !completed.has(id)).slice(0, 2);
}
