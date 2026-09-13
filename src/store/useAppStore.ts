import { create } from "zustand";
import type { JudgementChoice, ReadingLevel } from "../types/api";

interface JudgementDraft {
  choice?: JudgementChoice;
  reason?: string;
}

interface AppState {
  readingLevelByNewsId: Record<number, ReadingLevel>;
  setReadingLevel: (newsId: number, level: ReadingLevel) => void;

  judgementDraftByNewsId: Record<number, JudgementDraft>;
  setJudgementChoice: (newsId: number, choice: JudgementChoice) => void;
  setJudgementReason: (newsId: number, reason: string) => void;
  clearJudgementDraft: (newsId: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  readingLevelByNewsId: {},
  setReadingLevel: (newsId, level) =>
    set((state) => ({
      readingLevelByNewsId: { ...state.readingLevelByNewsId, [newsId]: level }
    })),

  judgementDraftByNewsId: {},
  setJudgementChoice: (newsId, choice) =>
    set((state) => ({
      judgementDraftByNewsId: {
        ...state.judgementDraftByNewsId,
        [newsId]: { ...state.judgementDraftByNewsId[newsId], choice }
      }
    })),
  setJudgementReason: (newsId, reason) =>
    set((state) => ({
      judgementDraftByNewsId: {
        ...state.judgementDraftByNewsId,
        [newsId]: { ...state.judgementDraftByNewsId[newsId], reason }
      }
    })),
  clearJudgementDraft: (newsId) =>
    set((state) => {
      const next = { ...state.judgementDraftByNewsId };
      delete next[newsId];
      return { judgementDraftByNewsId: next };
    })
}));
