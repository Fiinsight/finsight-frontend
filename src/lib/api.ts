import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type {
  ChartCandle,
  ChartCandleRaw,
  ChartData,
  ChartDataRaw,
  ChartDocent,
  ChartPoint,
  ChartPointRaw,
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
  ReadingLevel,
  TermExplainRequest,
  TermExplainResponseRaw,
  TermExplanation,
  Tone
} from "../types/api";
import { formatPercent } from "./format";
import { AUTH_STORAGE_KEY } from "./auth";
import { loadOnboardingProfile } from "./onboarding";
import { KEY_TERM_DICTIONARY, generateSampleChartPoints, getSamplePopularStock, sampleMarketSummary } from "./sampleData";

// Wi-Fi가 바뀌면 맥의 LAN IP도 바뀌어서 .env에 IP를 박아두는 방식은 매번 깨진다.
// Expo 개발 서버는 자신이 지금 물려 있는 실제 호스트를 hostUri로 넘겨주므로,
// 그 호스트를 그대로 재사용하면(포트만 8080으로 바꿔서) IP가 바뀌어도 항상 맞다.
function resolveApiBaseUrl(): string {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configuredApiUrl) {
    return configuredApiUrl;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:8080/api`;
  }
  return "http://localhost:8080/api";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 8000
});

api.interceptors.request.use(async (config) => {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw) as { accessToken?: string };
      if (session.accessToken) config.headers.set("Authorization", `Bearer ${session.accessToken}`);
    } catch {
      // A malformed local session should not prevent public API requests.
    }
  }
  return config;
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

export async function getKakaoLoginUrl(): Promise<string> {
  const { data } = await api.get<{ authorizationUrl: string }>("/auth/kakao/url");
  return data.authorizationUrl;
}

export async function loginWithKakao(code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/kakao", { code });
  return data;
}

export async function syncOnboardingProfile(): Promise<void> {
  const profile = await loadOnboardingProfile();
  if (!profile || profile.answers.length === 0) return;
  await api.put("/profile/onboarding", { answers: profile.answers });
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
    publishedAt: raw.publishedAt ?? raw.createdAt ?? new Date().toISOString(),
    summary: derivedSummary,
    rawContent,
    importanceReason: raw.importanceReason ?? "",
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
  // boolean directly, but does send `actualChangePercent` once the feedback
  // scheduler has run — derive alignment the same way the judgement-submit
  // normalizer does (UP aligned with a positive move, DOWN with a negative one,
  // NEUTRAL is never marked wrong outright).
  const derivedCorrect =
    raw.correct ??
    raw.aligned ??
    (raw.actualChangePercent !== undefined
      ? raw.choice === "NEUTRAL"
        ? Math.abs(raw.actualChangePercent) < 0.5
        : (raw.actualChangePercent >= 0) === (raw.choice === "UP")
      : null);

  return {
    id: raw.id ?? raw.judgementId ?? index,
    newsId: raw.newsId ?? index,
    newsTitle: raw.newsTitle ?? raw.title ?? "",
    choice: raw.choice ?? "NEUTRAL",
    actualResult:
      raw.actualResult ??
      (raw.actualChangePercent !== undefined
        ? `${raw.actualChangePercent > 0 ? "+" : ""}${raw.actualChangePercent}%`
        : raw.actualDirection ?? ""),
    correct: derivedCorrect,
    judgedAt: raw.judgedAt ?? raw.createdAt ?? new Date().toISOString()
  };
}

export async function getJudgementHistory(): Promise<JudgementHistoryItem[]> {
  const { data } = await api.get<JudgementHistoryItemRaw[]>("/judgements/history");
  return data.map(normalizeHistoryItem);
}

// ---------------------------------------------------------------------------
// Market summary
// ---------------------------------------------------------------------------

type ChangeFormat = "percent" | "point";

function normalizeMarketStat(
  label: string,
  raw: MarketStatRaw | undefined,
  fallback: MarketStat,
  changeFormat: ChangeFormat = "percent"
): MarketStat {
  if (!raw) {
    return fallback;
  }
  // finsight-backend's MarketIndexView uses `currentValue`, RateView uses `value`.
  const rawValue = raw.value ?? raw.currentValue;
  const value = rawValue !== undefined ? String(rawValue) : fallback.value;
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
    change = fallback.change;
  }

  const tone: Tone = raw.tone ?? (changeNumber !== undefined ? (changeNumber > 0 ? "up" : changeNumber < 0 ? "down" : "flat") : fallback.tone);

  return { label, value, change, tone };
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const { data } = await api.get<MarketSummaryRaw>("/market/summary");

  return {
    kospi: normalizeMarketStat("KOSPI", data.kospi, sampleMarketSummary.kospi),
    kosdaq: normalizeMarketStat("KOSDAQ", data.kosdaq, sampleMarketSummary.kosdaq),
    exchangeRate: normalizeMarketStat("원/달러", data.exchangeRate ?? data.usdKrw ?? data.usdKrwRate, sampleMarketSummary.exchangeRate),
    baseRate: normalizeMarketStat("기준금리", data.baseRate, sampleMarketSummary.baseRate, "point")
  };
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

function synthesizeCandlesFromPoints(points: ChartPoint[]): ChartCandle[] {
  // Sample/offline fallback has no real OHLC — approximate a plausible-looking
  // candle body around each close so the candlestick chart still renders.
  return points.map((p, i) => {
    const prevClose = i > 0 ? points[i - 1].value : p.value;
    const open = prevClose;
    const close = p.value;
    return {
      date: p.date,
      open,
      close,
      high: Math.max(open, close) * 1.004,
      low: Math.min(open, close) * 0.996
    };
  });
}

function normalizeChartData(raw: ChartDataRaw, symbol: string): ChartData {
  const rawPoints: Array<ChartPointRaw | ChartCandleRaw> = raw.points ?? raw.candles ?? [];
  const points: ChartPoint[] =
    rawPoints.length > 0
      ? rawPoints.map((point) => {
          const p = point as ChartPointRaw & ChartCandleRaw;
          return { date: p.date ?? "", value: p.value ?? p.close ?? p.price ?? 0 };
        })
      : generateSampleChartPoints(symbol, raw.price ?? getSamplePopularStock(symbol).price);

  const candles: ChartCandle[] =
    raw.candles && raw.candles.length > 0
      ? raw.candles.map((c) => ({
          date: c.date ?? "",
          open: c.open ?? c.close ?? 0,
          high: c.high ?? c.close ?? 0,
          low: c.low ?? c.close ?? 0,
          close: c.close ?? 0
        }))
      : synthesizeCandlesFromPoints(points);

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
    symbolName: raw.symbolName ?? raw.name ?? getSamplePopularStock(symbol).name,
    price: raw.price ?? points[points.length - 1]?.value ?? 0,
    changePercent: raw.changePercent ?? 0,
    points,
    candles,
    minuteCandles: (raw.minuteCandles ?? []).map((c) => ({
      date: c.timestamp ?? c.date ?? "",
      open: c.open ?? c.close ?? 0,
      high: c.high ?? c.close ?? 0,
      low: c.low ?? c.close ?? 0,
      close: c.close ?? 0
    })),
    period: raw.period ?? "D",
    intervalMinutes: raw.intervalMinutes ?? null,
    fallback: raw.fallback ?? false,
    moveInsights: raw.moveInsights ?? [],
    relatedNews: relatedNewsRaw.map((item) => ({
      id: item.id ?? item.newsId ?? null,
      title: item.title ?? "",
      source: item.source ?? "",
      publishedAt: item.publishedAt ?? item.date ?? new Date().toISOString()
    })),
    docent
  };
}

export async function getChartData(symbol: string, period: "D" | "W" | "MINUTE" = "D", interval = 5): Promise<ChartData> {
  const { data } = await api.get<ChartDataRaw>(`/charts/${symbol}`, { params: { period, interval } });
  return normalizeChartData(data, symbol);
}

export async function getPopularStocks(): Promise<PopularStock[]> {
  const { data } = await api.get<PopularStockRaw[]>("/stocks/popular");
  return data.map((item) => ({
    symbol: item.symbol ?? "",
    name: item.name ?? "",
    price: item.price ?? 0,
    changePercent: item.changePercent ?? 0
  }));
}

export type { ReadingLevel, JudgementChoice };
