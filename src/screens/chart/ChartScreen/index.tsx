import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { addWatchlist, getApiErrorMessage, getChartData, getPopularStocks, getWatchlist, removeWatchlist, searchStocks } from "../../../lib/api";
import { loadAuthSession } from "../../../lib/auth";
import { storageGetItem, storageSetItem } from "../../../lib/storage";
import { initialChartSymbol, lastWatchlistKey } from "../../../lib/watchlist";
import type { ChartStackParamList } from "../../../navigation/types";
import type { ChartRelatedNews, MoveInsight, WatchlistItem } from "../../../types/api";
import { WatchlistChips } from "./WatchlistChips";
import { ChartCard } from "./ChartCard";
import { ChartDocentPanel } from "./ChartDocentPanel";
import { strongestMove, movesByDate, moveDate } from "../../../lib/chartDocent";
import { RelatedNewsList } from "./RelatedNewsList";
import { PopularStockChips } from "./PopularStockChips";
import { StockHeader } from "./StockHeader";
import { StockSearchBar } from "./StockSearchBar";

type Props = NativeStackScreenProps<ChartStackParamList, "Chart">;
type Period = "D" | "W" | "MINUTE";

function isKoreanMarketOpen() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = values.weekday;
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday) && minutes >= 540 && minutes <= 930;
}

function formatMoveInsightTime(timestamp: string, period: Period) {
  const date = timestamp?.slice(0, 10) ?? "";
  if (period === "MINUTE") return timestamp?.replace("T", " ").slice(0, 16) ?? "";
  return period === "W" ? `${date} 주간 구간` : date;
}

export function ChartScreen({ route, navigation }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(route.params?.symbol ?? "");
  const [selectedStockName, setSelectedStockName] = useState<string | undefined>();
  const [entering, setEntering] = useState(true);
  const [watchlistError, setWatchlistError] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const client=useQueryClient();
  const watchlist=useQuery({queryKey:["watchlist"],queryFn:getWatchlist,retry:0});
  const watched=watchlist.data?.some(item=>item.symbol===selectedSymbol) ?? false;
  useFocusEffect(useCallback(()=>{
    let active=true;
    setEntering(true);
    void (async()=>{
      // Wait for a fresh owner list even when another tab has already populated the query cache.
      const [result,session]=await Promise.all([watchlist.refetch(),loadAuthSession()]);
      const items=result.data ?? [];
      const last=session?.userId ? await storageGetItem(lastWatchlistKey(session.userId)).catch(()=>null) : null;
      if(!active) return;
      const symbol=initialChartSymbol(route.params?.symbol,items,last);
      setOwnerId(session?.userId ?? null);setSelectedSymbol(symbol);setSelectedStockName(items.find(item=>item.symbol===symbol)?.name);setEntering(false);
    })().catch(()=>{if(active){setSelectedSymbol(route.params?.symbol ?? "005930");setEntering(false);setWatchlistError("관심종목을 확인하지 못했어요. 다시 시도해주세요");}});
    return ()=>{active=false;};
  },[route.params?.symbol,watchlist.refetch]));
  useEffect(()=>{
    if(watched && ownerId && !entering) void storageSetItem(lastWatchlistKey(ownerId),selectedSymbol)
      .catch(()=>setWatchlistError("기기에 마지막 관심종목을 저장하지 못했어요"));
  },[watched,ownerId,selectedSymbol,entering]);
  const toggle=useMutation({
    mutationFn:async ({symbol,wasWatched}:{symbol:string;wasWatched:boolean;name:string})=>{ if(wasWatched) await removeWatchlist(symbol); else await addWatchlist(symbol); },
    onMutate:async ({symbol,wasWatched,name})=>{
      setWatchlistError("");await client.cancelQueries({queryKey:["watchlist"]});
      const previous=client.getQueryData<WatchlistItem[]>(["watchlist"]);
      client.setQueryData<WatchlistItem[]>(["watchlist"],items=>wasWatched ? (items ?? []).filter(item=>item.symbol!==symbol)
        : [...(items ?? []),{symbol,name,addedAt:new Date().toISOString()}]);
      return {previous};
    },
    onError:(error,_variables,context)=>{client.setQueryData(["watchlist"],context?.previous);setWatchlistError(getApiErrorMessage(error,"관심종목을 저장하지 못했어요. 다시 시도해주세요"));},
    onSettled:()=>{void client.invalidateQueries({queryKey:["watchlist"]});void client.invalidateQueries({queryKey:["watchlist-news"]});void client.invalidateQueries({queryKey:["learning-recommendations"]});}
  });
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("D");
  const [minuteInterval, setMinuteInterval] = useState<1 | 5 | 15>(5);
  const [selectedInsight, setSelectedInsight] = useState<MoveInsight | null>(null);
  useEffect(() => setSelectedInsight(null), [selectedSymbol, period, minuteInterval]);

  const { data: popularStocksData, isError: stocksError, refetch: refetchStocks } = useQuery({
    queryKey: ["popular-stocks"],
    queryFn: getPopularStocks,
    retry: 0,
    staleTime: 60_000
  });
  const stocks = popularStocksData ?? [];
  const searchTerm = query.trim();

  const { data: searchResults = [], isFetching: searchFetching } = useQuery({
    queryKey: ["stock-search", searchTerm],
    queryFn: () => searchStocks(searchTerm),
    enabled: searchTerm.length > 0,
    staleTime: 10 * 60_000,
    retry: 0
  });

  const { data, isError: chartError, isFetching, refetch: refetchChart } = useQuery({
    queryKey: period === "MINUTE" ? ["chart", selectedSymbol, period, minuteInterval] : ["chart", selectedSymbol, period],
    queryFn: ({ signal }) => getChartData(selectedSymbol, period, minuteInterval, signal),
    enabled: Boolean(selectedSymbol) && !entering,
    retry: 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData
  });

  const chart = data?.symbol === selectedSymbol && data.period === period && (period !== "MINUTE" || data.intervalMinutes === minuteInterval) ? data : undefined;
  const displayCandles = chart && period === "MINUTE" && chart.minuteCandles.length > 0 ? chart.minuteCandles : chart?.candles ?? [];

  const scroll = useRef<ScrollView>(null);
  const docentY = useRef(0);
  const moves = movesByDate(chart?.moveInsights ?? []);
  const selected = moves.find(item => item.timestamp === selectedInsight?.timestamp) ?? strongestMove(moves);
  const selectedPosition = moves.findIndex(item => item.timestamp === selected?.timestamp);
  const selectMove = (insight: MoveInsight) => {
    setSelectedInsight(insight);
    scroll.current?.scrollTo({ y: docentY.current, animated: true });
  };

  const handleRelatedNewsPress = (item: ChartRelatedNews) => {
    if (item.id !== null && item.id !== undefined) {
      navigation.navigate("NewsDetail", { newsId: item.id });
    }
  };

  const handleCandlePress = (candle: { date: string }) => {
    const insight = moves.find(item => moveDate(item.timestamp, period) === moveDate(candle.date, period));
    if (insight) selectMove(insight);
  };

  const marketClosed = period === "MINUTE" && !isKoreanMarketOpen();
  const headerQuote = stocks.find((stock) => stock.symbol === selectedSymbol);
  const changeLabel = "전일 종가 대비";
  const selectStock = (symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedStockName(name);
    setQuery("");
  };

  if(entering) return <SafeAreaView style={styles.safeArea}><Text style={{padding:20}}>관심종목을 불러오는 중이에요</Text></SafeAreaView>;
  const stockName=selectedStockName ?? stocks.find(stock=>stock.symbol===selectedSymbol)?.name ?? chart?.symbolName ?? selectedSymbol;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scroll} contentContainerStyle={styles.container}>
        <StockSearchBar value={query} onChange={setQuery} />
        {searchTerm ? (
          <View style={styles.searchResults}>
            {searchFetching ? <Text style={styles.searchHint}>종목 검색 중...</Text> : null}
            {!searchFetching && searchResults.length === 0 ? <Text style={styles.searchHint}>일치하는 종목이 없습니다.</Text> : null}
            {searchResults.map((stock) => (
              <TouchableOpacity key={stock.symbol} style={styles.searchResult} onPress={() => selectStock(stock.symbol, stock.name)}>
                <Text style={styles.searchResultName}>{stock.name}</Text>
                <Text style={styles.searchResultSymbol}>{stock.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <WatchlistChips items={watchlist.data ?? []} selectedSymbol={selectedSymbol} onSelect={selectStock} />
        {stocks.length > 0 ? <PopularStockChips stocks={stocks} selectedSymbol={selectedSymbol} onSelect={(symbol) => selectStock(symbol, stocks.find((stock) => stock.symbol === symbol)?.name ?? chart?.symbolName ?? symbol)} /> : <View style={{ height: 64, backgroundColor: "#EAECF0", borderRadius: 12 }} accessibilityLabel="인기 종목 로딩 중" />}
        <StockHeader name={stockName} symbol={selectedSymbol} price={headerQuote?.fallback ? 0 : headerQuote?.price ?? chart?.price ?? 0} changePercent={headerQuote?.changePercent ?? chart?.changePercent ?? 0} changeLabel={changeLabel}
          watched={watched} watchlistBusy={toggle.isPending || watchlist.isPending || watchlist.isError}
          onToggleWatchlist={()=>toggle.mutate({symbol:selectedSymbol,name:stockName,wasWatched:watched})} />
        {watchlistError ? <Text accessibilityRole="alert" style={{color:"#B42318"}}>{watchlistError}</Text> : null}
        {watchlist.isError ? <TouchableOpacity accessibilityRole="button" onPress={()=>void watchlist.refetch()}><Text style={{color:"#B42318"}}>관심종목을 불러오지 못했어요 · 다시 시도</Text></TouchableOpacity> : null}
        {chartError || stocksError ? <TouchableOpacity accessibilityRole="button" onPress={() => { if (chartError) void refetchChart(); if (stocksError) void refetchStocks(); }}><Text style={styles.refreshText}>차트 다시 시도</Text></TouchableOpacity> : null}
        <View style={styles.periodRow}>
          <TouchableOpacity accessibilityRole="tab" accessibilityLabel="일봉" accessibilityState={{ selected: period === "D" }} style={[styles.periodTab, period === "D" && styles.periodTabActive]} onPress={() => setPeriod("D")}>
            <Text style={[styles.periodText, period === "D" && styles.periodTextActive]}>일봉</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="tab" accessibilityLabel="주봉" accessibilityState={{ selected: period === "W" }} style={[styles.periodTab, period === "W" && styles.periodTabActive]} onPress={() => setPeriod("W")}>
            <Text style={[styles.periodText, period === "W" && styles.periodTextActive]}>주봉</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="tab" accessibilityLabel="분봉" accessibilityState={{ selected: period === "MINUTE" }} style={[styles.periodTab, period === "MINUTE" && styles.periodTabActive]} onPress={() => setPeriod("MINUTE")}>
            <Text style={[styles.periodText, period === "MINUTE" && styles.periodTextActive]}>분봉</Text>
          </TouchableOpacity>
        </View>
        {period === "MINUTE" ? (
          <View style={styles.intervalRow}>
            {([1, 5, 15] as const).map((value) => (
              <TouchableOpacity key={value} accessibilityRole="tab" accessibilityLabel={`${value}분봉`} accessibilityState={{ selected: minuteInterval === value }} style={[styles.intervalTab, minuteInterval === value && styles.intervalTabActive]} onPress={() => setMinuteInterval(value)}>
                <Text style={[styles.intervalText, minuteInterval === value && styles.intervalTextActive]}>{value}분</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {isFetching ? (
          <View style={styles.refreshCard}>
            <Text style={styles.refreshText}>차트와 현재가를 갱신하고 있어요…</Text>
          </View>
        ) : null}
        {chart?.fallback || !data || stocksError || marketClosed ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>{marketClosed ? "현재 장외시간입니다" : "시세 상태 안내"}</Text>
            <Text style={styles.warningText}>{marketClosed ? "분봉은 최근 거래일 장중 데이터가 있을 때만 새로 갱신됩니다." : chartError || stocksError ? "실시간 시세 연결에 실패했습니다. 잠시 후 다시 시도해 주세요." : "현재 시세 데이터를 확인할 수 없습니다."}</Text>
          </View>
        ) : null}
        {chart ? <ChartCard
          candles={displayCandles}
          period={period}
          minuteInterval={minuteInterval}
          moveInsights={chart.moveInsights}
          selectedDate={selected ? moveDate(selected.timestamp, period) : undefined}
          onCandlePress={handleCandlePress}
        /> : <View style={styles.emptyCard}><Text style={styles.emptyText}>실제 차트 데이터가 없어 차트를 표시할 수 없습니다.</Text></View>}
        {chart && selected ? <View onLayout={event => { docentY.current = event.nativeEvent.layout.y; }}>
          <ChartDocentPanel insight={selected} period={period} onNewsPress={newsId => navigation.navigate("NewsDetail", { newsId })}
            hasPrevious={selectedPosition < moves.length - 1} hasNext={selectedPosition > 0}
            onPrevious={() => selectMove(moves[selectedPosition + 1])} onNext={() => selectMove(moves[selectedPosition - 1])} />
        </View> : null}
        {chart ? <RelatedNewsList key={`${selectedSymbol}:${period}:${selected?.timestamp ?? "all"}`} expandMarket={Boolean(selected)} items={selected ? selected.candidateNews : chart.relatedNews} onPress={handleRelatedNewsPress} /> : null}
        {chart && chart.moveInsights.length > 0 ? (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>급등락 시점과 관련 뉴스</Text>
            {moves.map((insight, index) => (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${formatMoveInsightTime(insight.timestamp, period)} 급등락 관련 뉴스 보기`} accessibilityState={{ selected: selected?.timestamp === insight.timestamp }} onPress={() => selectMove(insight)} key={`${insight.timestamp ?? "move"}-${index}`} style={styles.insightRow}>
                <Text style={[styles.insightMove, insight.changePercent && insight.changePercent > 0 ? styles.up : styles.down]}>
                  {insight.changePercent && insight.changePercent > 0 ? "+" : ""}{insight.changePercent?.toFixed(2)}%
                </Text>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTime}>{formatMoveInsightTime(insight.timestamp, period)}</Text>
                  <Text style={styles.insightNews} numberOfLines={2}>{insight.newsTitle || "관련 뉴스 없음"}</Text>
                  {insight.explanation ? <Text style={styles.insightExplanation}>{insight.explanation}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16
  },
  searchResults: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D0D5DD",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden"
  },
  searchResult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomColor: "#F2F4F7",
    borderBottomWidth: 1
  },
  searchResultName: { color: "#101828", fontSize: 14, fontWeight: "700" },
  searchResultSymbol: { color: "#667085", fontSize: 12 },
  searchHint: { color: "#667085", fontSize: 13, padding: 14 },
  refreshCard: {
    backgroundColor: "#EFF8FF",
    borderColor: "#B2DDFF",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 16
  },
  emptyText: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19
  },
  refreshText: { color: "#175CD3", fontSize: 12, fontWeight: "700" },
  periodRow: {
    flexDirection: "row",
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    padding: 4,
    gap: 4,
    alignSelf: "flex-start"
  },
  periodTab: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  periodTabActive: {
    backgroundColor: "#FFFFFF"
  },
  periodText: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "700"
  },
  periodTextActive: {
    color: "#101828"
  },
  intervalRow: {
    flexDirection: "row",
    gap: 8
  },
  intervalTab: {
    borderColor: "#D0D5DD",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  intervalTabActive: {
    backgroundColor: "#101828"
  },
  intervalText: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "700"
  },
  intervalTextActive: {
    color: "#FFFFFF"
  },
  warningCard: {
    backgroundColor: "#FFFAEB",
    borderColor: "#FEDF89",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4
  },
  warningTitle: {
    color: "#B54708",
    fontSize: 13,
    fontWeight: "800"
  },
  warningText: {
    color: "#93370D",
    fontSize: 12,
    lineHeight: 18
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 14
  },
  insightTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "800"
  },
  insightRow: {
    flexDirection: "row",
    gap: 12,
    borderTopColor: "#F2F4F7",
    borderTopWidth: 1,
    paddingTop: 12
  },
  insightMove: {
    width: 60,
    fontSize: 14,
    fontWeight: "800"
  },
  up: {
    color: "#D92D20"
  },
  down: {
    color: "#175CD3"
  },
  insightCopy: {
    flex: 1,
    gap: 3
  },
  insightTime: {
    color: "#98A2B3",
    fontSize: 11
  },
  insightNews: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  newsLink: {
    color: "#175CD3",
    textDecorationLine: "underline"
  },
  insightExplanation: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 17
  }
});
