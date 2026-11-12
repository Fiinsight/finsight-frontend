import type { MoveInsight } from "../types/api";
import type { ReadingLevel } from "../types/api";
import type { RootTabParamList } from "../navigation/types";
export function chartLearningParams(move: MoveInsight | null | undefined, level?: ReadingLevel): RootTabParamList["LearnTab"] {
  const newsId=move?.docent?.newsId ?? move?.newsId;
  return newsId ? { screen: "NewsDetail", params: { newsId, openQuiz: true, readMode: "level", ...(level ? { readingLevel: level } : {}) } } : undefined;
}
export function strongestMove(moves: MoveInsight[]) {
  return moves.reduce<MoveInsight | null>((best, move) => !best || Math.abs(move.changePercent) > Math.abs(best.changePercent) ? move : best, null);
}
export function movesByDate(moves: MoveInsight[]) {
  return [...moves].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function moveDate(timestamp: string, period: string) {
  return period === "MINUTE" ? timestamp.slice(0, 19) : timestamp.slice(0, 10);
}
