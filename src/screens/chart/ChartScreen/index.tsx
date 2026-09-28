import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getChartData, getPopularStocks, searchStocks } from "../../../lib/api";
import { getSampleChartData, popularStocks } from "../../../lib/sampleData";
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

export function ChartScreen({ route, navigation }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(route.params?.symbol ?? popularStocks[0].symbol);
  const [selectedStockName, setSelectedStockName] = useState<string | undefined>(route.params?.symbol ? undefined : popularStocks[0].name);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("W");
  const [minuteInterval, setMinuteInterval] = useState<5 | 15>(15);
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
  const stocks = popularStocksData && popularStocksData.length > 0 ? popularStocksData : popularStocks;
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
    retry: 0,
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData
  });

  const chart = data ?? getSampleChartData(selectedSymbol);
  const displayCandles = period === "MINUTE" && chart.minuteCandles.length > 0 ? chart.minuteCandles : chart.candles;

  // Only build a docent banner when there's a real, symbol-tagged news
  // article backing it — no more falling back to fixed sample copy that
  // has nothing to do with the actual chart being shown.
  const docentContent = chart.docent
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
    setSelectedInsight(chart.moveInsights.find((item) => item.timestamp.slice(0, 10) === day) ?? null);
  };

  const marketClosed = !isKoreanMarketOpen();
  const hasLiveChartData = Boolean(data) && !chart.fallback && !chartError && !stocksError;
  const latestCandle = displayCandles[displayCandles.length - 1];
  const latestDataLabel = latestCandle?.date
    ? period === "MINUTE"
      ? latestCandle.date.replace("T", " ").slice(0, 16)
      : latestCandle.date.slice(0, 10)
    : "최근 거래일";
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
        <PopularStockChips stocks={stocks} selectedSymbol={selectedSymbol} onSelect={(symbol) => selectStock(symbol, stocks.find((stock) => stock.symbol === symbol)?.name ?? chart.symbolName)} />
        <StockHeader name={selectedStockName ?? chart.symbolName} symbol={chart.symbol} price={chart.price} changePercent={chart.changePercent} changeLabel={changeLabel} />
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
            {([5, 15] as const).map((value) => (
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
        {chart.fallback || chartError || stocksError || (marketClosed && hasLiveChartData) ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>
              {chart.fallback || chartError || stocksError
                ? "시세 연결 안내"
                : period === "MINUTE"
                  ? "장 마감 - 최신 장중 데이터 기준"
                  : "장 마감 - 최신 종가 기준"}
            </Text>
            <Text style={styles.warningText}>
              {chart.fallback || chartError || stocksError
                ? "실시간 시세 연결에 실패해 예시 데이터가 표시되고 있습니다."
                : period === "MINUTE"
                  ? `${latestDataLabel} 기준 마지막 장중 데이터를 보여드려요. 다음 거래일 장중에 새 분봉이 갱신됩니다.`
                  : `${latestDataLabel} 장 마감 종가를 보여드려요. 다음 거래일 장중에 현재가가 갱신됩니다.`}
            </Text>
          </View>
        ) : null}
        <ChartCard
          candles={displayCandles}
          period={period}
          minuteInterval={minuteInterval}
          relatedNews={chart.relatedNews}
          onCandlePress={handleCandlePress}
        />
        {selectedInsight ? (
          <View style={styles.selectedInsight}>
            <Text style={styles.selectedInsightTitle}>선택한 급등락 지점</Text>
            <Text style={styles.selectedInsightMove}>
              {selectedInsight.changePercent > 0 ? "+" : ""}{selectedInsight.changePercent.toFixed(2)}%
            </Text>
            {selectedInsight.newsId !== null ? (
              <TouchableOpacity activeOpacity={0.75} onPress={() => handleMoveNewsPress(selectedInsight.newsId)}>
                <Text style={[styles.selectedInsightNews, styles.newsLink]}>
                  {selectedInsight.causeScore >= 0.8 ? "원인 가능성 높은 뉴스: " : "관련 뉴스(원인 미확정): "}
                  {selectedInsight.newsTitle}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.selectedInsightNews}>
                {chart.relatedNews.length > 0
                  ? "관련 뉴스는 있지만 주가 변동의 원인으로 확정할 근거가 부족합니다."
                  : "해당 구간에 확인된 관련 뉴스가 없습니다."}
              </Text>
            )}
            <Text style={styles.selectedInsightExplanation}>
              {selectedInsight.explanation || (chart.relatedNews.length > 0
                ? "관련 뉴스 목록에서 당시 보도를 확인할 수 있지만, 가격 변동과의 인과관계는 확인되지 않았습니다."
                : "해당 시점의 종목 관련 뉴스가 없어 가격 변동만 표시합니다.")}
            </Text>
          </View>
        ) : null}
        {chart.moveInsights.length > 0 ? (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>급등락 시점과 관련 뉴스</Text>
            {chart.moveInsights.map((insight, index) => (
              <View key={`${insight.timestamp ?? "move"}-${index}`} style={styles.insightRow}>
                <Text style={[styles.insightMove, insight.changePercent && insight.changePercent > 0 ? styles.up : styles.down]}>
                  {insight.changePercent && insight.changePercent > 0 ? "+" : ""}{insight.changePercent?.toFixed(2)}%
                </Text>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTime}>{insight.timestamp?.replace("T", " ").slice(0, 16)}</Text>
                  {insight.newsId !== null ? (
                    <TouchableOpacity activeOpacity={0.75} onPress={() => handleMoveNewsPress(insight.newsId)}>
                      <Text style={[styles.insightNews, styles.newsLink]}>{insight.newsTitle}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.insightNews}>해당 시각에 저장된 관련 뉴스가 없습니다.</Text>
                  )}
                  {insight.explanation ? <Text style={styles.insightExplanation}>{insight.explanation}</Text> : null}
                  {insight.causeScore > 0 ? <Text style={styles.insightConfidence}>근거 점수 {Math.round(insight.causeScore * 100)}%</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
        <RelatedNewsList items={chart.relatedNews} onPress={handleRelatedNewsPress} />
        {docentContent ? (
          <InsightBanner content={docentContent} changePercent={chart.changePercent} relatedNews={chart.relatedNews} onNewsPress={handleRelatedNewsPress} />
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
