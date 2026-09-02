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
// Judgements (POST /judgements) - confirmed request/response by
// API_CONTRACT.md, but the contract's `feedback` field is a plain string.
// The mockups want a richer result (aligned?, price change %, reason
// bullets, a mini chart) that the current contract doesn't carry yet, so
// `JudgementFeedback` below is an app-level shape synthesized in
// src/lib/api.ts from whatever the backend sends plus local sample data.
// ---------------------------------------------------------------------------

export interface JudgementRequest {
  newsId: number;
  choice: JudgementChoice;
  reason?: string;
}

export interface JudgementResponseRaw {
  newsId?: number;
  choice?: JudgementChoice;
  // API_CONTRACT.md documents this as a plain string, but keep the door
  // open for a richer object in case the backend evolves before both
  // sides integrate.
  feedback?:
    | string
    | {
        message?: string;
        aligned?: boolean;
        correct?: boolean;
        actualChangePercent?: number;
        priceChangePercent?: number;
        reasons?: string[];
        chart?: ChartPointRaw[];
      };
}

export interface JudgementFeedback {
  newsId: number;
  choice: JudgementChoice;
  aligned: boolean;
  message: string;
  actualChangePercent: number;
  reasons: string[];
  relatedSymbol: string;
  relatedSymbolName: string;
  chart: ChartPoint[];
  judgedAt: string;
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

export interface ChartDataRaw {
  symbol?: string;
  symbolName?: string;
  name?: string;
  price?: number;
  changePercent?: number;
  points?: ChartPointRaw[];
  candles?: ChartPointRaw[];
  markers?: ChartRelatedNewsRaw[];
  relatedNews?: ChartRelatedNewsRaw[];
  // Actual finsight-backend ChartResponse field name (items only carry date/newsId/title).
  newsMarkers?: ChartRelatedNewsRaw[];
}

export interface ChartData {
  symbol: string;
  symbolName: string;
  price: number;
  changePercent: number;
  points: ChartPoint[];
  relatedNews: ChartRelatedNews[];
}

export interface PopularStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}
