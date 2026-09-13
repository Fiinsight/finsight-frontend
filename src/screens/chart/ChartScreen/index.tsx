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
type Period = "D" | "W";

export function ChartScreen({ route, navigation }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(route.params?.symbol ?? popularStocks[0].symbol);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("W");

  const { data: popularStocksData } = useQuery({
    queryKey: ["popular-stocks"],
    queryFn: getPopularStocks,
    retry: 0,
    refetchInterval: 30_000
  });
  const stocks = popularStocksData && popularStocksData.length > 0 ? popularStocksData : popularStocks;

  const filteredStocks = useMemo(() => {
    if (!query.trim()) {
      return stocks;
    }
    const normalized = query.trim().toLowerCase();
    return stocks.filter((stock) => stock.name.toLowerCase().includes(normalized) || stock.symbol.includes(normalized));
  }, [query, stocks]);

  const { data } = useQuery({
    queryKey: ["chart-data", selectedSymbol, period],
    queryFn: () => getChartData(selectedSymbol, period),
    retry: 0
  });

  const chart = data ?? getSampleChartData(selectedSymbol);

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
        </View>
        <ChartCard candles={chart.candles} relatedNews={chart.relatedNews} />
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
  }
});
