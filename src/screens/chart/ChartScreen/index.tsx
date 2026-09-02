import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { getChartData } from "../../../lib/api";
import { getChartDocentContent, getSampleChartData, popularStocks } from "../../../lib/sampleData";
import type { ChartStackParamList } from "../../../navigation/types";
import type { ChartRelatedNews } from "../../../types/api";
import { ChartCard } from "./ChartCard";
import { InsightBanner } from "./InsightBanner";
import { PopularStockChips } from "./PopularStockChips";
import { StockHeader } from "./StockHeader";
import { StockSearchBar } from "./StockSearchBar";

type Props = NativeStackScreenProps<ChartStackParamList, "Chart">;

export function ChartScreen({ route, navigation }: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState(route.params?.symbol ?? popularStocks[0].symbol);
  const [query, setQuery] = useState("");

  const filteredStocks = useMemo(() => {
    if (!query.trim()) {
      return popularStocks;
    }
    const normalized = query.trim().toLowerCase();
    return popularStocks.filter((stock) => stock.name.toLowerCase().includes(normalized) || stock.symbol.includes(normalized));
  }, [query]);

  const { data } = useQuery({
    queryKey: ["chart-data", selectedSymbol],
    queryFn: () => getChartData(selectedSymbol),
    retry: 0
  });

  const chart = data ?? getSampleChartData(selectedSymbol);
  const docent = getChartDocentContent(selectedSymbol);

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
        <ChartCard points={chart.points} />
        <InsightBanner content={docent} relatedNews={chart.relatedNews} onNewsPress={handleRelatedNewsPress} />
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
  }
});
