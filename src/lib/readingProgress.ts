import { loadAuthSession } from "./auth";
import { getServerReadingLog, mergeServerReadingLog, putServerReading } from "./api";
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

const importing = new Map<number, Promise<DailyReadLog>>();
async function ownerSession(userId: number) {
  const session = await loadAuthSession();
  if (!session || session.userId !== userId) throw new Error("읽기 기록의 계정이 변경됐어요.");
  return session;
}
export async function syncReadingProgress(userId: number): Promise<DailyReadLog> {
  const pending = importing.get(userId);
  if (pending) return pending;
  const job = (async () => {
    const session = await ownerSession(userId);
    const marker = `finsight.learning.reading.server-import.v1:${userId}`;
    const saved = await storageGetItem(marker);
    if (saved === "done") return getServerReadingLog(session.accessToken);
    const deviceKey = `finsight.learning.reading.device.v1:${userId}`;
    let deviceId = await storageGetItem(deviceKey);
    if (!deviceId) {
      deviceId = `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      await storageSetItem(deviceKey, deviceId);
    }
    const local = await getLocalLog(storageKey(userId));
    const server = await mergeServerReadingLog(session.accessToken, deviceId, local);
    await ownerSession(userId);
    await storageSetItem(marker, "done");
    return server;
  })();
  importing.set(userId, job);
  try { return await job; } finally { importing.delete(userId); }
}
export async function getReadingLog(userId: number): Promise<DailyReadLog> {
  const server = await syncReadingProgress(userId);
  await ownerSession(userId);
  await storageSetItem(storageKey(userId), JSON.stringify(server));
  return server;
}
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

  await syncReadingProgress(session.userId);
  const server = await putServerReading(session.accessToken, newsId);
  await ownerSession(session.userId);
  await storageSetItem(storageKey(session.userId), JSON.stringify(server));
  return countDailyReads(server, localDateKey(date));
}
