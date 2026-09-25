import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getChartData, getPopularStocks } from "../../../lib/api";
import { getSampleChartData, popularStocks } from "../../../lib/sampleData";
import type { ChartStackParamList } from "../../../navigation/types";
import type { ChartRelatedNews } from "../../../types/api";
import { ChartCard } from "./ChartCard";
import { InsightBanner } from "./InsightBanner";
import { PopularStockChips } from "./PopularStockChips";
import { StockHeader } from "./StockHeader";
import { StockSearchBar } from "./StockSearchBar";

type Props = NativeStackScreenProps<ChartStackParamList, "Chart">;
type Period = "D" | "W" | "MINUTE";

export function ChartScreen({ route, navigation }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(route.params?.symbol ?? popularStocks[0].symbol);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("W");
  const [minuteInterval, setMinuteInterval] = useState<1 | 5 | 15>(5);

  const { data: popularStocksData, isError: stocksError } = useQuery({
    queryKey: ["popular-stocks"],
    queryFn: getPopularStocks,
    retry: 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false
  });
  const stocks = popularStocksData && popularStocksData.length > 0 ? popularStocksData : popularStocks;

  const filteredStocks = useMemo(() => {
    if (!query.trim()) {
      return stocks;
    }
    const normalized = query.trim().toLowerCase();
    return stocks.filter((stock) => stock.name.toLowerCase().includes(normalized) || stock.symbol.includes(normalized));
  }, [query, stocks]);

  const { data, isError: chartError } = useQuery({
    queryKey: ["chart-data", selectedSymbol, period, minuteInterval],
    queryFn: () => getChartData(selectedSymbol, period, minuteInterval),
    retry: 0
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <StockSearchBar value={query} onChange={setQuery} />
        <PopularStockChips stocks={filteredStocks} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
        <StockHeader name={chart.symbolName} symbol={chart.symbol} price={chart.price} changePercent={chart.changePercent} />
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
        {chart.fallback || !data || stocksError ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>샘플 데이터 표시 중</Text>
            <Text style={styles.warningText}>{chartError || stocksError ? "실시간 시세 연결에 실패해 예시 데이터가 표시되고 있습니다." : "현재 이 차트는 백엔드가 제공한 fallback 데이터입니다."}</Text>
          </View>
        ) : null}
        <ChartCard candles={displayCandles} relatedNews={chart.relatedNews} />
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
                  <Text style={styles.insightNews}>{insight.newsTitle ?? "해당 시각에 연결된 뉴스가 없습니다."}</Text>
                  {insight.explanation ? <Text style={styles.insightExplanation}>{insight.explanation}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {docentContent ? (
          <InsightBanner content={docentContent} relatedNews={chart.relatedNews} onNewsPress={handleRelatedNewsPress} />
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
  insightExplanation: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 17
  }
});
