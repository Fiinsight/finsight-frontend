import { loadAuthSession } from "./auth";
import { storageGetItem, storageSetItem } from "./storage";
import { addUniqueArticleRead, countDailyReads, localDateKey, type DailyReadLog } from "./readingProgressModel";

const STORAGE_PREFIX = "finsight.learning.reading.v1";

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}`;
}

async function getLocalLog(key: string): Promise<DailyReadLog> {
  try {
    const raw = await storageGetItem(key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([day, ids]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(`${day}T00:00:00Z`))
      && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day && Array.isArray(ids)
    ).map(([day, ids]) => [day, [...new Set((ids as unknown[]).filter((id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0))]]));
  } catch {
    return {};
  }
}

export async function getReadingLog(userId: number): Promise<DailyReadLog> { return getLocalLog(storageKey(userId)); }
export async function getJudgementViewLog(userId: number): Promise<DailyReadLog> { return getLocalLog(`finsight.learning.judgement-views.v1:${userId}`); }
export async function recordJudgementView(judgementId: number, date = new Date()): Promise<void> {
  const session = await loadAuthSession();
  if (!session) return;
  const log = await getJudgementViewLog(session.userId);
  const next = addUniqueArticleRead(log, localDateKey(date), judgementId);
  if (next !== log) await storageSetItem(`finsight.learning.judgement-views.v1:${session.userId}`, JSON.stringify(next));
}

/** A detail counts only when the screen has verified detail data and the user stays to read. */
export async function recordArticleRead(newsId: number, date = new Date()): Promise<number> {
  const session = await loadAuthSession();
  if (!session) return 0;

  const log = await getReadingLog(session.userId);
  const day = localDateKey(date);
  const next = addUniqueArticleRead(log, day, newsId);
  if (next !== log) await storageSetItem(storageKey(session.userId), JSON.stringify(next));
  return countDailyReads(next, day);
}
