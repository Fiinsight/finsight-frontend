// Shared types for the FinSight mobile app.
//
// The `*Raw` interfaces model what the Spring Boot backend might return.
// Only `GET /briefings/today` and `POST /judgements` are confirmed against
// API_CONTRACT.md at the repo root; every other endpoint is being built in
// parallel, so raw types keep fields optional/loose and `src/lib/api.ts`
// normalizes them into the stricter "app" shapes the screens consume.

export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type ReadingLevel = "beginner" | "normal" | "analyst";

export type JudgementChoice = "UP" | "NEUTRAL" | "DOWN";

export type Tone = "up" | "down" | "flat";

// ---------------------------------------------------------------------------
// Briefings (GET /briefings/today) - confirmed by API_CONTRACT.md
// ---------------------------------------------------------------------------

export interface NewsBrief {
  id: number;
  title: string;
  summary: string;
  importanceReason: string;
  relatedSymbol: string;
  sentimentHint: Sentiment;
}

// ---------------------------------------------------------------------------
// News detail (GET /news/{id}) - shape not finalized yet
// ---------------------------------------------------------------------------

export interface NewsDetailRaw {
  id?: number;
  title?: string;
  category?: string;
  publishedAt?: string;
  createdAt?: string;
  summary?: string;
  url?: string;
  source?: string;
  rawContent?: string;
  content?: string;
  originalContent?: string;
  importanceReason?: string;
  relatedSymbol?: string;
  relatedSymbolName?: string;
  symbolName?: string;
  sentimentHint?: Sentiment;
  keyTerms?: string[];
  beginnerContent?: string;
  normalContent?: string;
  analystContent?: string;
  // Actual finsight-backend NewsDetailResponse field names (flat, not nested).
  rewrittenBeginner?: string;
  rewrittenNormal?: string;
  rewrittenAnalyst?: string;
  levels?: {
    beginner?: string;
    normal?: string;
    analyst?: string;
  };
}

export interface NewsDetail {
  id: number;
  title: string;
  category: string;
  publishedAt: string;
  summary: string;
  rawContent: string;
  importanceReason: string;
  relatedSymbol: string;
  relatedSymbolName: string;
  sentimentHint: Sentiment;
  keyTerms: string[];
  levels: Record<ReadingLevel, string>;
  url: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Term explanation (POST /terms/explain) - shape not finalized yet
// ---------------------------------------------------------------------------

export interface TermExplainRequest {
  term: string;
  newsId: number;
}

export interface TermExplainResponseRaw {
  term?: string;
  definition?: string;
  meaning?: string;
  contextExplanation?: string;
  contextExplanationInNews?: string;
  marketImpact?: string;
}

export interface TermExplanation {
  term: string;
  definition: string;
  contextExplanation: string;
  marketImpact: string;
}

// ---------------------------------------------------------------------------
// Judgements (POST /judgements)
//
// The backend only ever returns an acknowledgment here (see
// JudgementService.recordJudgement / ACK_FEEDBACK_TEXT) — the real
// actual-direction/aligned/reasons comparison can't exist yet at submit time
// because the market hasn't moved yet; it's filled in a day later by
// FeedbackScheduler and only shows up via GET /judgements/history. This used
// to be faked here (random chart, hardcoded "삼성전자", invented aligned
// true/false) to match a richer mockup — removed because it rendered the
// exact same fake "result" on every single submission regardless of what was
// actually judged.
// ---------------------------------------------------------------------------

export interface JudgementRequest {
  newsId: number;
  choice: JudgementChoice;
  reason?: string;
}

export interface JudgementResponseRaw {
  newsId?: number;
  choice?: JudgementChoice;
  feedback?: string;
}

export interface JudgementAck {
  newsId: number;
  choice: JudgementChoice;
  message: string;
}

// ---------------------------------------------------------------------------
// Judgement history (GET /judgements/history) - shape not finalized yet
// ---------------------------------------------------------------------------

export interface JudgementHistoryItemRaw {
  id?: number;
  // Actual finsight-backend JudgementHistoryResponse uses `judgementId`.
  judgementId?: number;
  newsId?: number;
  newsTitle?: string;
  title?: string;
  choice?: JudgementChoice;
  actualResult?: string;
  actualDirection?: string;
  actualChangePercent?: number;
  correct?: boolean;
  aligned?: boolean;
  createdAt?: string;
  judgedAt?: string;
}

export interface JudgementHistoryItem {
  id: number;
  newsId: number;
  newsTitle: string;
  choice: JudgementChoice;
  actualResult: string;
  correct: boolean | null;
  judgedAt: string;
}

// ---------------------------------------------------------------------------
// Market summary (GET /market/summary) - shape not finalized yet
// ---------------------------------------------------------------------------

export interface MarketStat {
  label: string;
  value: string;
  change: string;
  tone: Tone;
}

export interface MarketStatRaw {
  value?: number | string;
  // Actual finsight-backend MarketIndexView field name for kospi/kosdaq.
  currentValue?: number | string;
  change?: number | string;
  changePercent?: number | string;
  changeLabel?: string;
  tone?: Tone;
  fallback?: boolean;
}

export interface MarketSummaryRaw {
  kospi?: MarketStatRaw;
  kosdaq?: MarketStatRaw;
  exchangeRate?: MarketStatRaw;
  usdKrw?: MarketStatRaw;
  // Actual finsight-backend MarketSummaryResponse field name.
  usdKrwRate?: MarketStatRaw;
  baseRate?: MarketStatRaw;
}

export interface MarketSummary {
  kospi: MarketStat;
  kosdaq: MarketStat;
  exchangeRate: MarketStat;
  baseRate: MarketStat;
}

// ---------------------------------------------------------------------------
// Charts (GET /charts/{symbol}) - shape not finalized yet
// ---------------------------------------------------------------------------

export interface ChartPointRaw {
  date?: string;
  value?: number;
  close?: number;
  price?: number;
}

export interface ChartPoint {
  date: string;
  value: number;
}

export interface ChartRelatedNewsRaw {
  id?: number;
  newsId?: number;
  title?: string;
  source?: string;
  publishedAt?: string;
  // Actual finsight-backend NewsMarkerView carries `date`, not `publishedAt`.
  date?: string;
}

export interface ChartRelatedNews {
  id: number | null;
  title: string;
  source: string;
  publishedAt: string;
}

export interface ChartCandleRaw {
  date?: string;
  timestamp?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface ChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartMinuteCandleRaw extends ChartCandleRaw {
  timestamp?: string;
}

export interface ChartMoveInsightRaw {
  timestamp?: string;
  changePercent?: number;
  newsId?: number | null;
  newsTitle?: string | null;
  newsSource?: string | null;
  explanation?: string | null;
}

export interface ChartDocentRaw {
  newsId?: number;
  newsTitle?: string;
  source?: string;
  whatHappened?: string;
  whyItMoved?: string;
}

export interface ChartDataRaw {
  symbol?: string;
  symbolName?: string;
  name?: string;
  price?: number;
  changePercent?: number;
  points?: ChartPointRaw[];
  candles?: ChartCandleRaw[];
  minuteCandles?: ChartMinuteCandleRaw[];
  period?: string;
  intervalMinutes?: number;
  fallback?: boolean;
  moveInsights?: ChartMoveInsightRaw[];
  markers?: ChartRelatedNewsRaw[];
  relatedNews?: ChartRelatedNewsRaw[];
  // Actual finsight-backend ChartResponse field name (items only carry date/newsId/title).
  newsMarkers?: ChartRelatedNewsRaw[];
  docent?: ChartDocentRaw | null;
}

export interface MoveInsight {
  timestamp: string;
  changePercent: number;
  newsId: number | null;
  newsTitle: string;
  newsSource: string;
  explanation: string;
}

export interface ChartDocent {
  newsId: number | null;
  newsTitle: string;
  source: string;
  whatHappened: string;
  whyItMoved: string;
}

export interface ChartData {
  symbol: string;
  symbolName: string;
  price: number;
  changePercent: number;
  points: ChartPoint[];
  candles: ChartCandle[];
  minuteCandles: ChartCandle[];
  period: string;
  intervalMinutes: number | null;
  fallback: boolean;
  moveInsights: MoveInsight[];
  relatedNews: ChartRelatedNews[];
  docent: ChartDocent | null;
}

export interface PopularStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface PopularStockRaw {
  symbol?: string;
  name?: string;
  price?: number;
  changePercent?: number;
}
