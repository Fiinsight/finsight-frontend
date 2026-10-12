import type { MoveInsight } from "../types/api";
export function strongestMove(moves: MoveInsight[]) {
  return moves.reduce<MoveInsight | null>((best, move) => !best || Math.abs(move.changePercent) > Math.abs(best.changePercent) ? move : best, null);
}
export function movesByDate(moves: MoveInsight[]) {
  return [...moves].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function moveDate(timestamp: string, period: string) {
  return period === "MINUTE" ? timestamp.slice(0, 19) : timestamp.slice(0, 10);
}
