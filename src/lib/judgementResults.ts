import type { JudgementHistoryItem } from "../types/api";
import { feedbackVerdict, hasUnreadFeedback, kstDate } from "./historyRecords";

export function resultDateLabel(date: string | null | undefined): string | null {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = new Date(`${date}T12:00:00+09:00`);
  if (!Number.isFinite(value.getTime()) || kstDate(value) !== date) return null;
  return value.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short" });
}
export function unreadJudgements(items: JudgementHistoryItem[], seen: Record<string,string>) {
  return items.filter(item => Number.isSafeInteger(item.id) && item.id > 0 && hasUnreadFeedback(item,seen))
    .sort((a,b) => (b.feedbackGeneratedAt ?? b.comparisonDate ?? "").localeCompare(a.feedbackGeneratedAt ?? a.comparisonDate ?? ""));
}
export function overdueJudgement(items: JudgementHistoryItem[], now = Date.now()) {
  return items.filter(item => item.actualDirection === null && item.expectedResultAt && Number.isFinite(Date.parse(item.expectedResultAt)) && Date.parse(item.expectedResultAt) <= now)
    .sort((a,b) => b.judgedAt.localeCompare(a.judgedAt))[0] ?? null;
}
export function resultBannerMessage(item: JudgementHistoryItem, now = new Date()) {
  const day=kstDate(new Date(item.judgedAt));
  const yesterday=kstDate(new Date(now.getTime()-86_400_000));
  const when=day===yesterday?"어제":day===kstDate(now)?"오늘":resultDateLabel(day) ?? "이전에";
  const subject=item.relatedSymbolName || (item.relatedSymbol==="KOSPI"?"코스피":item.relatedSymbol==="KOSDAQ"?"코스닥":"시장");
  const verdict=feedbackVerdict(item);
  const result=verdict==="PARTIAL"?"방향은 맞았지만 변동이 작았어요":verdict==="CORRECT"?(item.reasonText?.trim()?"정확한 판단이에요!":"예측한 방향과 일치했어요"):"다르게 움직였어요";
  return `${when} 판단한 ${subject} 결과가 나왔어요 · ${result}`;
}
