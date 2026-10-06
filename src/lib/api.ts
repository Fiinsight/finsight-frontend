import axios from "axios";
import { previousRange, type RecordRange } from "./historyRecords";
import Constants from "expo-constants";
import { getExpoGoProjectConfig } from "expo";
import type {
  ChartCandle,
  ChartCandleRaw,
  ChartData,
  ChartDataRaw,
  ChartDocent,
  ChartPoint,
  ChartPointRaw,
  ArticleNote,
  DailyNote,
  JudgementChoice,
  JudgementAck,
  JudgementHistoryItem,
  JudgementHistoryItemRaw,
  JudgementRequest,
  JudgementResponseRaw,
  MarketStat,
  MarketStatRaw,
  MarketSummary,
  MarketSummaryRaw,
  NewsBrief,
  NewsDetail,
  NewsDetailRaw,
  PopularStock,
  PopularStockRaw,
  StockSearchResult,
  ReadingLevel,
  TermExplainRequest,
  TermExplainResponseRaw,
  TermExplanation,
  Tone
} from "../types/api";
import { formatPercent } from "./format";
import { getActiveAccessToken, loadAuthSession, notifyAuthFailure } from "./auth";
import { loadOnboardingProfile, saveOnboardingProfile, mapOnboardingToLearningPreferences, type LearningPreferences, type OnboardingAnswer } from "./onboarding";
import { KEY_TERM_DICTIONARY } from "./sampleData";

export function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((item: any) => item.defaultMessage ?? item.message).filter(Boolean).join("\n");
  }
  return fallback;
}

// Wi-Fi가 바뀌면 맥의 LAN IP도 바뀌어서 .env에 IP를 박아두는 방식은 매번 깨진다.
// Expo 개발 서버는 자신이 지금 물려 있는 실제 호스트를 hostUri로 넘겨주므로,
// 그 호스트를 그대로 재사용하면(포트만 8080으로 바꿔서) IP가 바뀌어도 항상 맞다.
function resolveApiBaseUrl(): string {
  const webHost = typeof window !== "undefined" ? window.location?.hostname : undefined;
  if (webHost) {
    return `http://${webHost}:8080/api`;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? getExpoGoProjectConfig()?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:8080/api`;
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 8000,
  // localtunnel shows a browser warning page unless this header is present.
  // Keep it limited to the free development tunnel; production hosts do not need it.
  headers: process.env.EXPO_PUBLIC_API_BASE_URL?.includes(".loca.lt")
    ? { "Bypass-Tunnel-Reminder": "true" }
    : undefined
});

api.interceptors.request.use(async (config) => {
  const token = getActiveAccessToken() ?? (await loadAuthSession())?.accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  notifyAuthFailure(error.response?.status, error.config?.headers?.get?.("Authorization"));
  return Promise.reject(error);
});

export interface AuthResponse {
  accessToken: string;
  userId: number;
  email: string;
  nickname: string;
}

export async function signup(email: string, password: string, nickname: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/signup", { email, password, nickname });
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>("/auth/me");
  return data;
}

export async function getKakaoLoginUrl(state?: string): Promise<string> {
  const { data } = await api.get<{ authorizationUrl: string }>("/auth/kakao/url", { params: state ? { state } : undefined });
  return data.authorizationUrl;
}

export async function loginWithKakao(code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/kakao", { code });
  return data;
}

export async function syncOnboardingProfile(includePending = false): Promise<void> {
  const profile = await loadOnboardingProfile(includePending);
  if (!profile || profile.answers.length === 0) return;
  await api.put("/profile/onboarding", { answers: profile.answers });
  if (profile.userId == null) await saveOnboardingProfile(profile.answers);
}

export async function saveLearningSettings(answers: OnboardingAnswer[]): Promise<void> {
  await api.put("/profile/onboarding", { answers });
  await saveOnboardingProfile(answers);
}

export async function setDefaultReadingLevel(level: ReadingLevel): Promise<void> {
  await api.put("/profile/learning-level", { level });
}

export async function getLearningPreferences(): Promise<LearningPreferences> {
  try {
    const { data } = await api.get<{
      learningLevel?: string;
      learningPace?: string;
      learningFocus?: string;
      dailyGoal?: string;
      completedAt?: string;
    }>("/profile/onboarding");
    const level = data.learningLevel === "analyst" || data.learningLevel === "normal" ? data.learningLevel : "beginner";
    const pace = data.learningPace === "deep" ? "deep" : data.learningPace === "flexible" ? "on-demand" : "micro";
    const focus = data.learningFocus === "judgement" ? "decision" : data.learningFocus === "market" ? "market" : data.learningFocus === "routine" ? "reflection" : "news";
    return { level, pace, focus, dailyGoal: data.dailyGoal || "뉴스 하나 읽기", source: data.completedAt ? "onboarding" : "default" };
  } catch {
    const local = await loadOnboardingProfile();
    return local ? { ...mapOnboardingToLearningPreferences(local.answers), source: "local" } : { level: "beginner", pace: "micro", focus: "news", dailyGoal: "뉴스 하나 읽기", source: "default" };
  }
}

// ---------------------------------------------------------------------------
// Briefings
// ---------------------------------------------------------------------------

export async function getTodayBriefing(): Promise<NewsBrief[]> {
  const { data } = await api.get<NewsBrief[]>("/briefings/today");
  return data;
}

export async function getMoreBriefing(page: number, size = 10): Promise<NewsBrief[]> {
  const { data } = await api.get<NewsBrief[]>("/briefings/more", { params: { page, size } });
  return data;
}

// ---------------------------------------------------------------------------
// News detail
// ---------------------------------------------------------------------------

function normalizeNewsDetail(raw: NewsDetailRaw, fallbackId: number): NewsDetail {
  const rawContent = raw.rawContent ?? raw.content ?? raw.originalContent ?? "";
  const levels = {
    beginner: raw.levels?.beginner ?? raw.beginnerContent ?? raw.rewrittenBeginner ?? "",
    normal: raw.levels?.normal ?? raw.normalContent ?? raw.rewrittenNormal ?? "",
    analyst: raw.levels?.analyst ?? raw.analystContent ?? raw.rewrittenAnalyst ?? ""
  };
  const importanceReasons = {
    beginner: raw.importanceReasonBeginner ?? raw.importanceReason ?? "",
    normal: raw.importanceReasonNormal ?? raw.importanceReason ?? "",
    analyst: raw.importanceReasonAnalyst ?? raw.importanceReason ?? ""
  };

  const keyTerms =
    raw.keyTerms && raw.keyTerms.length > 0
      ? raw.keyTerms
      : KEY_TERM_DICTIONARY.filter((term) => rawContent.includes(term) || levels.normal.includes(term));

  // finsight-backend's NewsDetailResponse has no dedicated `summary` field —
  // derive one from the normal-level rewrite (or the importance reason) so
  // the home/detail screens always have something short to show.
  const derivedSummary =
    raw.summary ?? (levels.normal ? `${levels.normal.slice(0, 80)}${levels.normal.length > 80 ? "…" : ""}` : raw.importanceReason ?? "");

  return {
    id: raw.id ?? fallbackId,
    title: raw.title ?? "",
    category: raw.category ?? "국내증시",
    publishedAt: raw.publishedAt ?? "",
    summary: derivedSummary,
    rawContent,
    importanceReason: raw.importanceReason ?? "",
    importanceReasons,
    relatedSymbol: raw.relatedSymbol ?? "",
    relatedSymbolName: raw.relatedSymbolName ?? raw.symbolName ?? raw.relatedSymbol ?? "",
    sentimentHint: raw.sentimentHint ?? "NEUTRAL",
    keyTerms,
    levels,
    url: raw.url ?? "",
    source: raw.source ?? ""
  };
}

export async function getNewsDetail(id: number): Promise<NewsDetail> {
  const { data } = await api.get<NewsDetailRaw>(`/news/${id}`);
  return normalizeNewsDetail(data, id);
}

// ---------------------------------------------------------------------------
// Term explanation
// ---------------------------------------------------------------------------

export async function explainTerm(payload: TermExplainRequest): Promise<TermExplanation> {
  const { data } = await api.post<TermExplainResponseRaw>("/terms/explain", payload);
  return {
    term: data.term ?? payload.term,
    definition: data.definition ?? data.meaning ?? "",
    contextExplanation: data.contextExplanation ?? data.contextExplanationInNews ?? "",
    marketImpact: data.marketImpact ?? ""
  };
}

// ---------------------------------------------------------------------------
// Judgements
// ---------------------------------------------------------------------------

export async function submitJudgement(request: JudgementRequest): Promise<JudgementAck> {
  const { data } = await api.post<JudgementResponseRaw>("/judgements", request);
  return {
    newsId: data.newsId ?? request.newsId,
    choice: data.choice ?? request.choice,
    message: data.feedback ?? "판단이 기록되었습니다. 다음날 이후 '기록' 탭에서 실제 결과를 확인해보세요."
  };
}

// ---------------------------------------------------------------------------
// Judgement history
// ---------------------------------------------------------------------------

function normalizeHistoryItem(raw: JudgementHistoryItemRaw, index: number): JudgementHistoryItem {
  // finsight-backend's JudgementHistoryResponse doesn't send a `correct`/`aligned`
  // boolean directly, but does send the actual direction once the feedback
  // scheduler has run. Prefer that authoritative value; a 0% change is
  // NEUTRAL, not an UP hit.
  const actualDirection = raw.actualDirection?.trim().toUpperCase();
  let derivedCorrect: boolean | null = raw.correct ?? raw.aligned ?? null;
  if (derivedCorrect === null) {
    if (actualDirection) {
      derivedCorrect = actualDirection === "UNKNOWN" ? null : actualDirection === raw.choice;
    } else if (raw.actualChangePercent !== undefined && raw.actualChangePercent !== null) {
      derivedCorrect = raw.choice === "NEUTRAL"
        ? Math.abs(raw.actualChangePercent) < 0.5
        : raw.choice === "UP" ? raw.actualChangePercent > 0 : raw.actualChangePercent < 0;
    }
  }

  return {
    id: raw.id ?? raw.judgementId ?? index,
    newsId: raw.newsId ?? index,
    newsTitle: raw.newsTitle ?? raw.title ?? "",
    choice: raw.choice ?? "NEUTRAL",
    actualResult:
      raw.actualResult ??
      (raw.actualChangePercent !== undefined
        && raw.actualChangePercent !== null
        ? `${raw.actualChangePercent > 0 ? "+" : ""}${raw.actualChangePercent}%`
        : raw.actualDirection ?? ""),
    correct: derivedCorrect,
    feedbackText: raw.feedbackText ?? "",
    reasons: Array.isArray(raw.reasons) ? raw.reasons.filter((reason): reason is string => typeof reason === "string" && reason.trim().length > 0) : (raw.reasonText?.split(/\n+/).map((reason) => reason.trim()).filter(Boolean) ?? []),
    judgedAt: raw.judgedAt ?? raw.createdAt ?? ""
  };
}

export async function getJudgementHistory(): Promise<JudgementHistoryItem[]> {
  const { data } = await api.get<JudgementHistoryItemRaw[]>("/judgements/history");
  return data.map(normalizeHistoryItem);
}

export interface RecordPage<T> { items: T[]; nextRange?: RecordRange }

export async function getJudgementHistoryRange(range: RecordRange, signal?: AbortSignal): Promise<RecordPage<JudgementHistoryItem>> {
  const response = await api.get<JudgementHistoryItemRaw[]>("/judgements/history", { params: range, signal });
  return { items: response.data.map(normalizeHistoryItem), nextRange: previousRange(response.headers["x-previous-record-date"] ?? "", range.from) };
}

export async function getArticleNotesRange(range: RecordRange, signal?: AbortSignal): Promise<RecordPage<ArticleNote>> {
  const response = await api.get<ArticleNote[]>("/article-notes", { params: range, signal });
  return { items: response.data, nextRange: previousRange(response.headers["x-previous-record-date"] ?? "", range.from) };
}

export async function getDailyNotes(): Promise<DailyNote[]> {
  const { data } = await api.get<DailyNote[]>("/notes");
  return data;
}

export async function saveTodayNote(content: string): Promise<DailyNote> {
  const { data } = await api.put<DailyNote>("/notes/today", { content });
  return data;
}

export async function getArticleNotes(): Promise<ArticleNote[]> {
  const { data } = await api.get<ArticleNote[]>("/article-notes");
  return data;
}

export async function getArticleNotesForNews(newsId: number): Promise<ArticleNote[]> {
  const { data } = await api.get<ArticleNote[]>(`/article-notes/news/${newsId}`);
  return data;
}

export async function createArticleNote(newsId: number, content: string): Promise<ArticleNote> {
  const { data } = await api.post<ArticleNote>("/article-notes", { newsId, content });
  return data;
}

export async function updateArticleNote(noteId: number, content: string): Promise<ArticleNote> {
  const { data } = await api.put<ArticleNote>(`/article-notes/${noteId}`, { content });
  return data;
}

export async function deleteArticleNote(noteId: number): Promise<void> {
  await api.delete(`/article-notes/${noteId}`);
}

// ---------------------------------------------------------------------------
// Market summary
// ---------------------------------------------------------------------------

type ChangeFormat = "percent" | "point";

function normalizeMarketStat(
  label: string,
  raw: MarketStatRaw | undefined,
  changeFormat: ChangeFormat = "percent"
): MarketStat {
  const rawValue = raw?.value ?? raw?.currentValue;
  if (!raw || raw.fallback || rawValue == null || String(rawValue).trim() === "" || !Number.isFinite(Number(rawValue))) {
    return { label, value: "확인할 수 없음", change: "fallback", tone: "flat" };
  }
  const value = String(rawValue);
  const changeNumber = typeof raw.changePercent === "number" ? raw.changePercent : undefined;

  let change: string;
  if (raw.changeLabel !== undefined) {
    change = String(raw.changeLabel);
  } else if (changeNumber !== undefined) {
    // 기준금리는 정책금리라 관례상 "%"가 아니라 %p(퍼센트포인트)로 읽음 —
    // 3.00 -> 예: 2.75였다면 상대 변화율로는 +9.1%지만 실제로는 +0.25%p일
    // 뿐이라, 그대로 %로 보여주면 오해를 줌.
    change = changeFormat === "point" ? (changeNumber === 0 ? "동결" : `${changeNumber > 0 ? "+" : ""}${changeNumber.toFixed(2)}%p`) : formatPercent(changeNumber);
  } else if (raw.change !== undefined) {
    change = String(raw.change);
  } else {
    change = "변동 정보 없음";
  }

  const tone: Tone = raw.tone ?? (changeNumber !== undefined ? (changeNumber > 0 ? "up" : changeNumber < 0 ? "down" : "flat") : "flat");

  return { label, value, change, tone };
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const { data } = await api.get<MarketSummaryRaw>("/market/summary");

  return {
    kospi: normalizeMarketStat("KOSPI", data.kospi),
    kosdaq: normalizeMarketStat("KOSDAQ", data.kosdaq),
    exchangeRate: normalizeMarketStat("원/달러", data.exchangeRate ?? data.usdKrw ?? data.usdKrwRate),
    baseRate: normalizeMarketStat("기준금리", data.baseRate, "point")
  };
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

function normalizeChartData(raw: ChartDataRaw, symbol: string): ChartData {
  if (raw.fallback) throw Object.assign(new Error("실제 차트 데이터를 확인할 수 없습니다."), { name: "ChartFallbackError" });
  const rawPoints: Array<ChartPointRaw | ChartCandleRaw> = raw.points ?? raw.candles ?? [];

  const points: ChartPoint[] = rawPoints.filter((point) => {
    const p = point as ChartPointRaw & ChartCandleRaw;
    return !!p.date && Number.isFinite(p.value ?? p.close ?? p.price);
  }).map((point) => {
    const p = point as ChartPointRaw & ChartCandleRaw;
    return { date: p.date ?? "", value: p.value ?? p.close ?? p.price ?? 0 };
  });

  const candles: ChartCandle[] =
    raw.candles && raw.candles.length > 0
      ? raw.candles.filter((c) => !!c.date && [c.open, c.high, c.low, c.close].every(Number.isFinite)).map((c) => ({
          date: c.date ?? "",
          open: c.open ?? c.close ?? 0,
          high: c.high ?? c.close ?? 0,
          low: c.low ?? c.close ?? 0,
          close: c.close ?? 0
        }))
      : [];

  // finsight-backend's ChartResponse calls this field `newsMarkers`, and each
  // marker only carries {date, newsId, title} — no `source`.
  const relatedNewsRaw = raw.relatedNews ?? raw.markers ?? raw.newsMarkers ?? [];

  const docent: ChartDocent | null = raw.docent
    ? {
        newsId: raw.docent.newsId ?? null,
        newsTitle: raw.docent.newsTitle ?? "",
        source: raw.docent.source ?? "",
        whatHappened: raw.docent.whatHappened ?? "",
        whyItMoved: raw.docent.whyItMoved ?? ""
      }
    : null;

  return {
    symbol: raw.symbol ?? symbol,
    symbolName: raw.symbolName ?? raw.name ?? symbol,
    price: raw.price ?? points[points.length - 1]?.value ?? 0,
    changePercent: raw.changePercent ?? 0,
    points,
    candles,
    minuteCandles: (raw.minuteCandles ?? []).filter((c) => !!(c.timestamp ?? c.date) && [c.open, c.high, c.low, c.close].every(Number.isFinite)).map((c) => ({
      date: c.timestamp ?? c.date ?? "",
      open: c.open ?? c.close ?? 0,
      high: c.high ?? c.close ?? 0,
      low: c.low ?? c.close ?? 0,
      close: c.close ?? 0
    })),
    period: raw.period ?? "D",
    intervalMinutes: raw.intervalMinutes ?? null,
    fallback: raw.fallback ?? (points.length === 0 && candles.length === 0),
    moveInsights: (raw.moveInsights ?? []).map((insight) => ({
      timestamp: insight.timestamp ?? "",
      changePercent: insight.changePercent ?? 0,
      newsId: insight.newsId ?? null,
      newsTitle: insight.newsTitle ?? "",
      newsSource: insight.newsSource ?? "",
      explanation: insight.explanation ?? "",
      causeScore: insight.causeScore ?? 0
    })),
    relatedNews: relatedNewsRaw.map((item) => ({
      id: item.id ?? item.newsId ?? null,
      title: item.title ?? "",
      source: item.source ?? "",
      publishedAt: item.publishedAt ?? item.date ?? ""
    })),
    docent
  };
}

export async function getChartData(symbol: string, period: "D" | "W" | "MINUTE" = "D", interval = 5, signal?: AbortSignal): Promise<ChartData> {
  const { data } = await api.get<ChartDataRaw>(`/charts/${symbol}`, { params: { period, interval }, signal, timeout: 15_000 });
  return normalizeChartData(data, symbol);
}

export async function getPopularStocks(): Promise<PopularStock[]> {
  const { data } = await api.get<PopularStockRaw[]>("/stocks/popular", { timeout: 20_000 });
  return data.map((item) => ({
    symbol: item.symbol ?? "",
    name: item.name ?? "",
    price: item.price ?? 0,
    changePercent: item.changePercent ?? 0
  }));
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const { data } = await api.get<StockSearchResult[]>("/stocks/search", { params: { query } });
  return data.map((item) => ({ symbol: item.symbol ?? "", name: item.name ?? "" }));
}

export type { ReadingLevel, JudgementChoice };

export interface NewsLesson {
  newsId: number;
  level: ReadingLevel;
  summary: string;
  readingGuide: string;
  mode: "RULE_FALLBACK" | "UNAVAILABLE";
  glossary: Array<{ term: string; definition: string }>;
  question: { term: string; prompt: string; options: string[] } | null;
}
export interface LearningAnswer { correct: boolean; definition: string; message: string }
export interface LearningReview { newsId: number; title: string; term: string; definition: string; level: ReadingLevel; answeredAt: string }
export async function getNewsLesson(newsId: number, level: ReadingLevel): Promise<NewsLesson> {
  return (await api.get<NewsLesson>(`/learning/news/${newsId}`, { params: { level } })).data;
}
export async function answerLearningQuestion(newsId: number, level: ReadingLevel, term: string, answerIndex: number): Promise<LearningAnswer> {
  return (await api.post<LearningAnswer>(`/learning/news/${newsId}/answers`, { level, term, answerIndex })).data;
}
export async function getLearningReviews(): Promise<LearningReview[]> {
  return (await api.get<LearningReview[]>("/learning/reviews")).data;
}
