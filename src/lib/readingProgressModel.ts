export const DAILY_ARTICLE_GOAL = 3;
export type DailyReadLog = Record<string, number[]>;

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
