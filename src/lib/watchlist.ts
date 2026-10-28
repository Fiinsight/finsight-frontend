import type { NewsBrief, WatchlistItem } from "../types/api";

export const lastWatchlistKey = (userId: number) => `finsight:lastWatchlistSymbol:${userId}`;
export function initialChartSymbol(routeSymbol: string | undefined, watchlist: WatchlistItem[], lastSymbol: string | null): string {
  return routeSymbol || (watchlist.some(item => item.symbol === lastSymbol) ? lastSymbol! : watchlist[0]?.symbol) || "005930";
}
export function withoutWatchlistNews(items: NewsBrief[], excludedIds: number[]): NewsBrief[] {
  const excluded = new Set(excludedIds);
  return items.filter(item => !excluded.has(item.id));
}
export function watchlistNewsState(loading: boolean, failed: boolean, watchlistCount: number, newsCount: number): string | null {
  if (loading) return "관심종목 소식을 불러오는 중이에요";
  if (failed) return "관심종목 소식을 불러오지 못했어요";
  if (!watchlistCount) return "차트에서 ☆를 눌러 관심종목을 추가해보세요";
  return newsCount ? null : "최근 관심종목 소식이 없어요";
}

export function selectHomeNews(core: NewsBrief[], watched: NewsBrief[]): NewsBrief[] {
  const seen = new Set<number>();
  return [...watched.slice(0, 1), ...core, ...watched.slice(1)].filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 3);
}
