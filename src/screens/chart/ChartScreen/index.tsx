import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getChartData, getPopularStocks, searchStocks } from "../../../lib/api";
import type { ChartStackParamList } from "../../../navigation/types";
import type { ChartRelatedNews, MoveInsight } from "../../../types/api";
import { ChartCard } from "./ChartCard";
import { InsightBanner } from "./InsightBanner";
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
  return period === "W" ? `${date} 주간 구간` : timestamp?.replace("T", " ").slice(0, 16);
}

export function ChartScreen({ route, navigation }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(route.params?.symbol ?? "");
  const [selectedStockName, setSelectedStockName] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("W");
  const [minuteInterval, setMinuteInterval] = useState<1 | 5 | 15>(5);
  const [selectedInsight, setSelectedInsight] = useState<MoveInsight | null>(null);

  const { data: popularStocksData, isError: stocksError } = useQuery({
    queryKey: ["popular-stocks"],
    queryFn: getPopularStocks,
    retry: 0,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
  const stocks = popularStocksData ?? [];
  useEffect(() => {
    const firstStock = popularStocksData?.[0];
    if (!selectedSymbol && firstStock) {
      setSelectedSymbol(firstStock.symbol);
      setSelectedStockName(firstStock.name);
    }
  }, [popularStocksData, selectedSymbol]);
  const searchTerm = query.trim();

  const { data: searchResults = [], isFetching: searchFetching } = useQuery({
    queryKey: ["stock-search", searchTerm],
    queryFn: () => searchStocks(searchTerm),
    enabled: searchTerm.length > 0,
    staleTime: 10 * 60_000,
    retry: 0
  });

  const { data, isError: chartError, isFetching } = useQuery({
    queryKey: ["chart-data", selectedSymbol, period, minuteInterval],
    queryFn: () => getChartData(selectedSymbol, period, minuteInterval),
    enabled: Boolean(selectedSymbol),
    retry: 0,
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData
  });

  const chart = data;
  const displayCandles = chart && period === "MINUTE" && chart.minuteCandles.length > 0 ? chart.minuteCandles : chart?.candles ?? [];

  // Only build a docent banner when there's a real, symbol-tagged news
  // article backing it — no more falling back to fixed sample copy that
  // has nothing to do with the actual chart being shown.
  const docentContent = chart?.docent
    ? {
        insightTitle: chart.docent.newsTitle,
        whatHappened: chart.docent.whatHappened,
        whyItMoved: chart.docent.whyItMoved,
        marketImpact: chart.docent.source ? `${chart.docent.source} 보도를 근거로 한 설명입니다.` : "관련 뉴스를 근거로 한 설명입니다."
      }
    : null;

  const handleRelatedNewsPress = (item: ChartRelatedNews) => {
    if (item.id !== null && item.id !== undefined) {
      navigation.navigate("NewsDetail", { newsId: item.id });
    }
  };

  const handleMoveNewsPress = (newsId: number | null) => {
    if (newsId !== null) {
      navigation.navigate("NewsDetail", { newsId });
    }
  };

  const handleCandlePress = (candle: { date: string }) => {
    const day = candle.date.slice(0, 10);
    setSelectedInsight(chart?.moveInsights.find((item) => item.timestamp.slice(0, 10) === day) ?? null);
  };

  const marketClosed = period === "MINUTE" && !isKoreanMarketOpen();
  const changeLabel = period === "D"
    ? "전일 종가 대비"
    : period === "W"
      ? "전주 종가 대비"
      : `직전 ${minuteInterval}분봉 대비`;
  const selectStock = (symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedStockName(name);
    setQuery("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
        {stocks.length > 0 ? <PopularStockChips stocks={stocks} selectedSymbol={selectedSymbol} onSelect={(symbol) => selectStock(symbol, stocks.find((stock) => stock.symbol === symbol)?.name ?? chart?.symbolName ?? symbol)} /> : null}
        {chart ? <StockHeader name={selectedStockName ?? chart.symbolName} symbol={chart.symbol} price={chart.price} changePercent={chart.changePercent} changeLabel={changeLabel} /> : <View style={styles.emptyCard}><Text style={styles.emptyText}>{stocksError ? "인기 종목을 불러오지 못했습니다." : "시세 데이터를 불러오는 중입니다."}</Text></View>}
        <View style={styles.periodRow}>
          <TouchableOpacity style={[styles.periodTab, period === "D" && styles.periodTabActive]} onPress={() => setPeriod("D")}>
            <Text style={[styles.periodText, period === "D" && styles.periodTextActive]}>일봉</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.periodTab, period === "W" && styles.periodTabActive]} onPress={() => setPeriod("W")}>
            <Text style={[styles.periodText, period === "W" && styles.periodTextActive]}>주봉</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.periodTab, period === "MINUTE" && styles.periodTabActive]} onPress={() => setPeriod("MINUTE")}>
            <Text style={[styles.periodText, period === "MINUTE" && styles.periodTextActive]}>분봉</Text>
          </TouchableOpacity>
        </View>
        {period === "MINUTE" ? (
          <View style={styles.intervalRow}>
            {([1, 5, 15] as const).map((value) => (
              <TouchableOpacity key={value} style={[styles.intervalTab, minuteInterval === value && styles.intervalTabActive]} onPress={() => setMinuteInterval(value)}>
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
            <Text style={styles.warningText}>{marketClosed ? "분봉은 최근 거래일 장중 데이터가 있을 때만 새로 갱신됩니다." : chartError || stocksError ? "실시간 시세 연결에 실패했습니다. 잠시 후 다시 시도해 주세요." : "현재 이 차트는 백엔드가 제공한 fallback 데이터입니다."}</Text>
          </View>
        ) : null}
        {chart ? <ChartCard
          candles={displayCandles}
          period={period}
          minuteInterval={minuteInterval}
          relatedNews={chart.relatedNews}
          moveInsights={chart.moveInsights}
          onCandlePress={handleCandlePress}
        /> : <View style={styles.emptyCard}><Text style={styles.emptyText}>실제 차트 데이터가 없어 차트를 표시할 수 없습니다.</Text></View>}
        {chart && selectedInsight ? (
          <View style={styles.selectedInsight}>
            <Text style={styles.selectedInsightTitle}>선택한 급등락 지점</Text>
            <Text style={styles.selectedInsightMove}>
              {selectedInsight.changePercent > 0 ? "+" : ""}{selectedInsight.changePercent.toFixed(2)}%
            </Text>
            {selectedInsight.newsId !== null ? (
              <TouchableOpacity activeOpacity={0.75} onPress={() => handleMoveNewsPress(selectedInsight.newsId)}>
                <Text style={[styles.selectedInsightNews, styles.newsLink]}>{selectedInsight.newsTitle}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.selectedInsightNews}>연결된 뉴스가 없습니다.</Text>
            )}
            <Text style={styles.selectedInsightExplanation}>
              {selectedInsight.explanation || "해당 시점의 종목 관련 뉴스가 없어 가격 변동만 표시합니다."}
            </Text>
          </View>
        ) : null}
        {chart && chart.moveInsights.length > 0 ? (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>급등락 시점과 관련 뉴스</Text>
            {chart.moveInsights.map((insight, index) => (
              <View key={`${insight.timestamp ?? "move"}-${index}`} style={styles.insightRow}>
                <Text style={[styles.insightMove, insight.changePercent && insight.changePercent > 0 ? styles.up : styles.down]}>
                  {insight.changePercent && insight.changePercent > 0 ? "+" : ""}{insight.changePercent?.toFixed(2)}%
                </Text>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTime}>{formatMoveInsightTime(insight.timestamp, period)}</Text>
                  {insight.newsId !== null ? (
                    <TouchableOpacity activeOpacity={0.75} onPress={() => handleMoveNewsPress(insight.newsId)}>
                      <Text style={[styles.insightNews, styles.newsLink]}>{insight.newsTitle}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.insightNews}>해당 시각에 저장된 관련 뉴스가 없습니다.</Text>
                  )}
                  {insight.explanation ? <Text style={styles.insightExplanation}>{insight.explanation}</Text> : null}
                  {insight.causeScore > 0 ? <Text style={styles.insightConfidence}>연관성 점수 {Math.round(insight.causeScore * 100)}% · 규칙 기반</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {chart ? <RelatedNewsList items={chart.relatedNews} onPress={handleRelatedNewsPress} /> : null}
        {docentContent ? (
          <InsightBanner content={docentContent} changePercent={chart?.changePercent ?? 0} relatedNews={chart?.relatedNews ?? []} onNewsPress={handleRelatedNewsPress} />
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
  },
  insightConfidence: {
    color: "#027A48",
    fontSize: 11,
    fontWeight: "700"
  },
  selectedInsight: {
    backgroundColor: "#F0F9FF",
    borderColor: "#B9E6FE",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 5
  },
  selectedInsightTitle: {
    color: "#026AA2",
    fontSize: 13,
    fontWeight: "800"
  },
  selectedInsightMove: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "900"
  },
  selectedInsightNews: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  selectedInsightExplanation: {
    color: "#475467",
    fontSize: 12,
    lineHeight: 18
  }
});
