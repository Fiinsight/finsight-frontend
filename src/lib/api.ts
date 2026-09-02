import axios from "axios";
import type {
  ChartData,
  ChartDataRaw,
  ChartPoint,
  JudgementChoice,
  JudgementFeedback,
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
  ReadingLevel,
  TermExplainRequest,
  TermExplainResponseRaw,
  TermExplanation,
  Tone
} from "../types/api";
import { KEY_TERM_DICTIONARY, generateSampleChartPoints, getSamplePopularStock, sampleMarketSummary } from "./sampleData";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  timeout: 8000
});

// ---------------------------------------------------------------------------
// Briefings
// ---------------------------------------------------------------------------

export async function getTodayBriefing(): Promise<NewsBrief[]> {
  const { data } = await api.get<NewsBrief[]>("/briefings/today");
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
    levels
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

function normalizeJudgementFeedback(raw: JudgementResponseRaw, request: JudgementRequest): JudgementFeedback {
  const choice = raw.choice ?? request.choice;
  const feedback = raw.feedback;
  const feedbackText = typeof feedback === "string" ? feedback : feedback?.message;
  const feedbackObject = typeof feedback === "object" && feedback !== null ? feedback : undefined;

  const stock = getSamplePopularStock("005930");
  const chart: ChartPoint[] =
    feedbackObject?.chart && feedbackObject.chart.length > 0
      ? feedbackObject.chart.map((point) => ({ date: point.date ?? "", value: point.value ?? point.close ?? point.price ?? 0 }))
      : generateSampleChartPoints(String(request.newsId), stock.price, 14);

  const actualChangePercent =
    feedbackObject?.actualChangePercent ?? feedbackObject?.priceChangePercent ?? Math.round((chart[chart.length - 1].value / chart[0].value - 1) * 1000) / 10;

  const aligned = feedbackObject?.aligned ?? feedbackObject?.correct ?? actualChangePercent >= 0 === (choice === "UP");

  const reasons =
    feedbackObject?.reasons && feedbackObject.reasons.length > 0
      ? feedbackObject.reasons
      : [feedbackText ?? "AI가 판단 근거를 분석했습니다.", "실제 시장 데이터와 비교한 결과입니다."];

  return {
    newsId: request.newsId,
    choice,
    aligned,
    message: feedbackText ?? (aligned ? "판단과 실제 결과가 일치했습니다." : "판단과 실제 결과가 달랐어요."),
    actualChangePercent,
    reasons,
    relatedSymbol: "005930",
    relatedSymbolName: "삼성전자",
    chart,
    judgedAt: new Date().toISOString()
  };
}

export async function submitJudgement(request: JudgementRequest): Promise<JudgementFeedback> {
  const { data } = await api.post<JudgementResponseRaw>("/judgements", request);
  return normalizeJudgementFeedback(data, request);
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

function normalizeMarketStat(label: string, raw: MarketStatRaw | undefined, fallback: MarketStat): MarketStat {
  if (!raw) {
    return fallback;
  }
  // finsight-backend's MarketIndexView uses `currentValue`, RateView uses `value`.
  const rawValue = raw.value ?? raw.currentValue;
  const value = rawValue !== undefined ? String(rawValue) : fallback.value;
  const changeSource = raw.changeLabel ?? raw.change ?? raw.changePercent;
  const change = changeSource !== undefined ? String(changeSource) : fallback.change;
  const tone: Tone = raw.tone ?? (typeof raw.changePercent === "number" ? (raw.changePercent > 0 ? "up" : raw.changePercent < 0 ? "down" : "flat") : fallback.tone);

  return { label, value, change, tone };
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const { data } = await api.get<MarketSummaryRaw>("/market/summary");

  return {
    kospi: normalizeMarketStat("KOSPI", data.kospi, sampleMarketSummary.kospi),
    kosdaq: normalizeMarketStat("KOSDAQ", data.kosdaq, sampleMarketSummary.kosdaq),
    exchangeRate: normalizeMarketStat("원/달러", data.exchangeRate ?? data.usdKrw ?? data.usdKrwRate, sampleMarketSummary.exchangeRate),
    baseRate: normalizeMarketStat("기준금리", data.baseRate, sampleMarketSummary.baseRate)
  };
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

function normalizeChartData(raw: ChartDataRaw, symbol: string): ChartData {
  const rawPoints = raw.points ?? raw.candles ?? [];
  const points: ChartPoint[] =
    rawPoints.length > 0
      ? rawPoints.map((point) => ({ date: point.date ?? "", value: point.value ?? point.close ?? point.price ?? 0 }))
      : generateSampleChartPoints(symbol, raw.price ?? getSamplePopularStock(symbol).price);

  // finsight-backend's ChartResponse calls this field `newsMarkers`, and each
  // marker only carries {date, newsId, title} — no `source`.
  const relatedNewsRaw = raw.relatedNews ?? raw.markers ?? raw.newsMarkers ?? [];

  return {
    symbol: raw.symbol ?? symbol,
    symbolName: raw.symbolName ?? raw.name ?? getSamplePopularStock(symbol).name,
    price: raw.price ?? points[points.length - 1]?.value ?? 0,
    changePercent: raw.changePercent ?? 0,
    points,
    relatedNews: relatedNewsRaw.map((item) => ({
      id: item.id ?? item.newsId ?? null,
      title: item.title ?? "",
      source: item.source ?? "",
      publishedAt: item.publishedAt ?? item.date ?? new Date().toISOString()
    }))
  };
}

export async function getChartData(symbol: string): Promise<ChartData> {
  const { data } = await api.get<ChartDataRaw>(`/charts/${symbol}`);
  return normalizeChartData(data, symbol);
}

export type { ReadingLevel, JudgementChoice };
