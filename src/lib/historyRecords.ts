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

export function pendingResultLabel(reason: string | null | undefined, expectedDate?: string | null): string {
  if(reason === "EXCLUDED_QA") return "테스트 기록";
  if(reason === "CALENDAR_UNSUPPORTED") return "휴장일 달력 확인 필요";
  if(reason === "PRICE_UNAVAILABLE") return "시세 확인 중 · 자동으로 다시 시도해요";
  if(reason === "NOT_DUE" && expectedDate && /^\d{4}-\d{2}-\d{2}$/.test(expectedDate)) {
    const day=new Date(`${expectedDate}T12:00:00+09:00`);
    if(Number.isFinite(day.getTime()) && kstDate(day)===expectedDate) {
      const weekday=day.toLocaleDateString("ko-KR",{weekday:"short",timeZone:"Asia/Seoul"});
      return `${Number(expectedDate.slice(5,7))}월 ${Number(expectedDate.slice(8))}일(${weekday}) 15:40 이후 결과`;
    }
  }
  return "결과 대기";
}

export function judgementResult(item: Pick<JudgementHistoryItem, "choice" | "actualDirection" | "actualChangePercent"> & { feedbackText?: string; feedbackReasons?: JudgementHistoryItem["feedbackReasons"]; comparisonDate?: string | null; gradingIssue?: string | null; unavailableReason?: string | null; pendingReason?: string | null; expectedResultDate?: string | null }) {
  const example = (item.feedbackText ?? "").includes("[시연용 가상 결과]");
  const direction = item.actualDirection;
  const excluded = !direction && item.pendingReason === "EXCLUDED_QA";
  const pending = !direction && !excluded;
  const adjustment = item.gradingIssue === "PRICE_ADJUSTMENT" || (item.actualChangePercent != null && Math.abs(item.actualChangePercent)>30.000000001);
  const invalidTarget = item.gradingIssue === "TARGET_MISMATCH" || adjustment;
  const unavailable = direction === "UNKNOWN" || invalidTarget || excluded;
  const legacy = !pending && !excluded && (!item.comparisonDate || example);
  const correct = pending || unavailable || legacy ? null : direction === item.choice;
  const percent = item.actualChangePercent;
  const change = percent !== null && Number.isFinite(percent) ? ` ${percent > 0 ? "+" : ""}${percent.toFixed(2)}%` : "";
  const label = excluded ? "테스트 기록" : adjustment ? "가격 조정 확인 필요" : example ? "예시" : pending ? pendingResultLabel(item.pendingReason,item.expectedResultDate) : unavailable ? "기사 복습" : legacy ? "당일 흐름 참고" : `실제 ${direction === "UP" ? "상승" : direction === "DOWN" ? "하락" : "중립"}${change}`;
  const reviewText = !pending && (unavailable || legacy) ? item.feedbackReasons?.[0]?.detail : null;
  const feedbackText = excluded ? "채점에서 제외한 테스트 기록이에요." : pending && item.pendingReason && !adjustment ? pendingResultLabel(item.pendingReason,item.expectedResultDate) : adjustment ? (item.unavailableReason || "가격 조정 확인 필요: 종가 등락률이 ±30%를 넘어 채점을 보류했어요.") : reviewText || (invalidTarget ? item.unavailableReason || "이 기사와 채점 종목의 연결을 다시 확인해야 해요. 이전 적중 여부와 피드백은 학습 근거로 사용하지 않아요." : legacy && !unavailable ? "이 기록은 판단한 날의 가격으로 비교돼 다음 거래일 예측의 결과로 해석하기 어려워요. 대상과 비교 종가가 확인된 새 판단에서 설명을 확인해보세요." : unavailable ? "관련 종목이 없어 결과를 비교하지 않았어요" : (item.feedbackText ?? "").replace(/\bUP\b/g, "상승").replace(/\bDOWN\b/g, "하락").replace(/\bNEUTRAL\b/g, "중립").replace(/\bUNKNOWN\b/g, "비교 불가"));
  return { label, correct, pending, unavailable, legacy, example, feedbackText, excluded };
}

export function judgementSummary(items: JudgementHistoryItem[]) {
  const results = items.map(judgementResult);
  return {
    total: results.filter(result=>!result.excluded).length,
    testRecords: results.filter(result=>result.excluded).length,
    hits: results.filter((result) => result.correct === true).length,
    pending: results.filter((result) => result.pending).length,
    unavailable: results.filter((result) => result.unavailable && !result.excluded).length,
    legacy: results.filter((result) => result.legacy && !result.unavailable).length
  };
}

export function judgementClosingPoints(item: Pick<JudgementHistoryItem, "judgedAt" | "comparisonDate" | "judgementClose" | "comparisonClose">) {
  const day = kstDate(item.judgedAt);
  const comparison = item.comparisonDate;
  if (!day || !comparison || !/^\d{4}-\d{2}-\d{2}$/.test(comparison) || kstDate(`${comparison}T00:00:00+09:00`) !== comparison || comparison <= day
      || typeof item.judgementClose !== "number" || !Number.isFinite(item.judgementClose) || item.judgementClose <= 0
      || typeof item.comparisonClose !== "number" || !Number.isFinite(item.comparisonClose) || item.comparisonClose <= 0) return null;
  return [{date: day, value: item.judgementClose}, {date: comparison, value: item.comparisonClose}];
}

export function feedbackVerdict(item: JudgementHistoryItem) {
  const result = judgementResult(item);
  if (result.pending || result.unavailable || result.legacy) return null;
  if (result.correct && item.actualChangePercent != null && Math.abs(item.actualChangePercent) <= 1 + 1e-9) return "PARTIAL";
  return result.correct ? "CORRECT" : "WRONG";
}
export function feedbackVersion(item: JudgementHistoryItem) {
  if (!item.comparisonDate || typeof item.actualChangePercent !== "number" || !Number.isFinite(item.actualChangePercent) || judgementResult(item).pending || judgementResult(item).unavailable || judgementResult(item).example) return null;
  return item.feedbackGeneratedAt || item.comparisonDate;
}
export function hasUnreadFeedback(item: JudgementHistoryItem, seen: Record<string, string>) {
  const version = feedbackVersion(item);
  return version != null && seen[String(item.id)] !== version;
}
