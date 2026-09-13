import type { JudgementAck } from "../types/api";

// Routes shared by every tab's stack navigator so that the news detail ->
// judgement -> feedback flow works no matter which tab it was entered from
// (e.g. tapping a related-news row on the Chart tab, or a past judgement on
// the History tab).
export type NewsFlowParamList = {
  NewsDetail: { newsId: number };
  Judgement: { newsId: number };
  // Only an acknowledgment — the real result isn't known until the next
  // trading day (see FeedbackScreen for why there's no chart/aligned here).
  Feedback: { newsId: number; ack: JudgementAck };
};

export type HomeStackParamList = NewsFlowParamList & {
  Home: undefined;
};

export type ChartStackParamList = NewsFlowParamList & {
  Chart: { symbol?: string } | undefined;
};

export type HistoryStackParamList = NewsFlowParamList & {
  History: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  ChartTab: undefined;
  HistoryTab: undefined;
  LearnTab: undefined;
  ProfileTab: undefined;
};
