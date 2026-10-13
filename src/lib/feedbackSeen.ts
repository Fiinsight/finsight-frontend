import { storageGetItem, storageSetItem } from "./storage";
import { loadAuthSession } from "./auth";
import { feedbackVersion } from "./historyRecords";
import type { JudgementHistoryItem } from "../types/api";
const key = (owner: number) => `finsight.judgement-feedback.seen.v1:${owner}`;
export async function getSeenFeedback(owner: number): Promise<Record<string, string>> {
  try {
    const value = JSON.parse(await storageGetItem(key(owner)) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => { const [id, version] = entry; return /^\d+$/.test(id) && typeof version === "string"; }));
  } catch { return {}; }
}
let pending = Promise.resolve();
export function markFeedbackSeen(item: JudgementHistoryItem): Promise<void> {
  const version = feedbackVersion(item);
  if (!version) return Promise.resolve();
  const session = loadAuthSession();
  pending = pending.catch(() => {}).then(async () => {
    const owner = await session;
    if (!owner) return;
    const seen = await getSeenFeedback(owner.userId);
    await storageSetItem(key(owner.userId), JSON.stringify({ ...seen, [String(item.id)]: version }));
  });
  return pending;
}
