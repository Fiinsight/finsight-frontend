import { loadAuthSession } from "./auth";
import { storageGetItem, storageSetItem } from "./storage";
import { addUniqueArticleRead, countDailyReads, localDateKey, type DailyReadLog } from "./readingProgressModel";

const STORAGE_PREFIX = "finsight.learning.reading.v1";

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export async function getReadingLog(userId: number): Promise<DailyReadLog> {
  try {
    const raw = await storageGetItem(storageKey(userId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as DailyReadLog;
  } catch {
    return {};
  }
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
